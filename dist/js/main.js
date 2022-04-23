import { firebaseConfig, uiConfig } from './config.js';
import { dateString, notice, isValidDate } from './functions.js';
firebase.initializeApp(firebaseConfig);
firebase.analytics();
const ui = new firebaseui.auth.AuthUI(firebase.auth());
const db = firebase.firestore();
const d = new Date();
const thisYear = '' + d.getFullYear();
const thisMonth = `0${d.getMonth() + 1}`.slice(-2);

const app = new Vue({
    el: '#app',
    data: {
        uid: '',
        email: '',
        displayName: 'guest',
        costsMonth: [],
        costActive: {},
        tags: ['食物', '家用', '交通'],
        tagsActive: [],
        tagsFilter: [],
        newTagName: '',
        isEditCost: false,
        isEditTag: false,
        isSettings: false,
        year: thisYear,
        month: thisMonth,
        oldCosts: [],
    },
    computed: {
        totalMonth: function() {
            const { costsMonth } = this;
            return costsMonth.reduce((a, b) => a + parseInt(b.price, 10), 0);
        },
        tagsTotal: function() {
            const { costsMonth } = this;
            let allTags = [];
            if (costsMonth) costsMonth.map(cost => cost.tags.map(tag => allTags.push(tag)));
            allTags = Array.from(new Set(allTags));
            let tagsTotal = [];
            allTags.map(tag => {
                const sameTagCosts = costsMonth.filter(cost => cost.tags.includes(tag));
                const total = sameTagCosts.reduce((a ,b) => a + parseInt(b.price), 0);
                tagsTotal.push({
                    name: tag,
                    total, 
                });
            });
            return tagsTotal;
        },
        costsList: function() {
            const { costsMonth, tagsFilter } = this;
            let newCostsMonth = JSON.parse(JSON.stringify(costsMonth));
            if (tagsFilter.length) {
                newCostsMonth = newCostsMonth.filter(cost => cost.tags.some(tag => tagsFilter.includes(tag)));
            }
            let target = [];
            newCostsMonth.map(cost => {
                const { id, y, m, d, name, price, tags } = cost;
                const index = target.findIndex(item => item.d === d);
                if (index === -1) {
                    target.push({
                        d,
                        list: [{ id, name, price, tags, y, m, d }],
                    });
                } else {
                    target[index].list.push({ id, name, price, tags, y, m, d });
                }
            });
            target.map(item => {
                const dayTotal = item.list.reduce((a, b) => a + parseInt(b.price), 0);
                item.total = dayTotal;
            });
            target.sort((a,b) => a.d.localeCompare(b.d));
            return target;
        },
    },
    watch: {
        month: function(newMonth, oldMonth) {
            this.getCostsMonth();
        },
    },
    mounted: function() {
        firebase.auth().onAuthStateChanged(user => {
            if (user) {
                this.uid = user.uid;
                this.email = user.email;
                this.displayName = user.displayName;
                this.getData();
                this.getCostsMonth();
            } else {
                ui.start('#firebaseui-auth-container', uiConfig);
            }
        });
        this.a2hs();
    },
    methods: {
        getCostsMonth: function() {
            const { uid, year, month } = this;
            let result = [];
            let query = db.collection('costs');
            query = query.where('userID', '==', uid);
            query = query.where('y', '==', year);
            query = query.where('m', '==', month);
            query.get()
                .then((querySnapshot) => {
                    querySnapshot.forEach((doc) => {
                        result.push({ id: doc.id, ...doc.data() });
                    });
                    this.costsMonth = result;
                })
                .catch((error) => {
                    console.log("Error getting documents: ", error);
                });
        },
        getCosts: function() {
            const { uid } = this;
            let result = [];
            db.collection('costs').where('userID', '==', uid).get()
                .then((querySnapshot) => {
                    querySnapshot.forEach((doc) => {
                        result.push({ id: doc.id, ...doc.data() });
                    });
                    this.costs = result;
                })
                .catch((error) => {
                    console.log("Error getting documents: ", error);
                });
        },
        getData: function() {
            const { uid } = this;
            db.collection('users').doc(uid).get().then(doc => {
                if (doc.exists) {
                    const { tags, } = doc.data();
                    if (tags.length) this.tags = tags;
                } else {
                    db.collection('users').doc(uid).set({ tags: [], });
                }
            });
        },
        a2hs: function() {
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('service-worker.js')
                    .then()
                    .catch(err => console.log(err));
            }
            window.addEventListener('beforeinstallprompt', function(e) {
                e.userChoice.then((choiceResult) => {
                    choiceResult.outcome === 'dismissed' ? console.log('User cancelled home screen install') : console.log('User added to home screen');
                });
            });
        },
        editCost: function(cost) {
            if (cost.id) {
                this.isEditCost = true;
                cost.date = `${cost.y}-${cost.m}-${cost.d}`;
                this.costActive = cost;
                this.tagsActive = cost.tags;
            } else {
                this.isEditCost = !this.isEditCost;
                const data = { date: dateString() };
                this.costActive = data;
            }
        },
        updateCost: function() {
            const { uid, costActive, tagsActive, year, month } = this;
            const { id, date, price, name } = costActive;
            const y = date.substring(0, 4);
            const m = date.substring(5, 7);
            const d = date.substring(8, 10);
            let data = { userID: uid, price, name, y, m, d, tags: tagsActive, };
            if (id) {
                return db.collection('costs').doc(id).update(data)
                    .then(() => {
                        const index = this.costs.findIndex(cost => cost.id === id);
                        data.id = id;
                        if (index !== -1) this.costs.splice(index, 1, data);
                        notice(`${name} 已更新`, 'success');
                    })
                    .catch(error => {
                        console.error("Error adding document: ", error);
                    });
            }
            return db.collection('costs').add(data)
                .then(docRef => {
                    data.id = docRef.id;
                    if (y === year && m === month) this.costsMonth.push(data);
                    notice(`${name} 已新增`, 'success');
                })
                .catch(error => {
                    console.error("Error adding document: ", error);
                });
        },
        deleteCost: function() {
            const { id, name } = this.costActive;
            db.collection('costs').doc(id).delete()
                .then(() => {
                    const index = this.costsMonth.findIndex(cost => cost.id === id);
                    if (index !== -1) this.costs.splice(index, 1);
                    this.isEditCost = false;
                    notice(`${name} 已刪除`, 'success');
                })
                .catch(error => {
                    console.error("Error adding document: ", error);
                });;
        },
        updateTag: function(type, tag='') {
            const { uid, tags, newTagName } = this;
            const self = this;
            if (type === 'add') {
                if (tags.includes(newTagName)) return notice('標籤已經存在');
                tags.push(newTagName);
            }
            if (type === 'delete') {
                const index = tags.findIndex(item => item === tag);
                tags.splice(index, 1)
            }
            db.collection('users').doc(uid).update({ tags })
                .then(() => {
                    notice('更新標籤成功', 'success')
                    self.getData();
                    self.tagsActive = [];
                })
                .catch(error => {
                    notice(`更新標籤失敗：${error}`);
                });
        },
        toggleTag: function(tag, target) {
            const index = target.findIndex(item => item === tag);
            index === -1 ? target.push(tag) : target.splice(index, 1);
        },
        changeMonth: function(num) {
            const { year, month } = this;
            if (month === '12' && num === 1) {
                this.year = '' + (parseInt(year) + 1);
                this.month = '01';
            } else if (month === '01' && num === -1) {
                this.year = '' + (parseInt(year) - 1);
                this.month = '12';
            } else {
                this.month = ('0' + (parseInt(month) + num)).slice(-2);
            }
        },
        changeInputDate: function(day) {
            const { costActive } = this;
            const date = new Date(costActive.date);
            let newDate = new Date(date.getTime() + day * 86400 * 1000);
            if (!isValidDate(date)) newDate = new Date();
            this.$set(costActive, 'date', dateString(newDate)); 
        },
        logout: function() {
            const self = this;
            firebase.auth().signOut().then(function() {
                notice('登出成功', 'success');
                self.uid = '';
                self.isSettings = false;
            }).catch(function(error) {
                notice(`error: ${error}`, 'error', false);
            });
        },
        nc: function(x) {
            return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
    },
});




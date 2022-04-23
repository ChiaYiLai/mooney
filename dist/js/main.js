import { firebaseConfig, uiConfig } from './config.js';
import { dateString, notice, isValidDate } from './functions.js';
firebase.initializeApp(firebaseConfig);
firebase.analytics();
const ui = new firebaseui.auth.AuthUI(firebase.auth());
const db = firebase.firestore();

const app = new Vue({
    el: '#app',
    data: {
        uid: '',
        email: '',
        displayName: 'guest',
        costs: [],
        costActive: {},
        tags: ['食物', '家用', '交通'],
        tagsActive: [],
        tagsFilter: [],
        newTagName: '',
        isEditCost: false,
        isEditTag: false,
        isSettings: false,
        dateActive: dateString(),
        oldCosts: [],
    },
    computed: {
        costsMonth: function() {
            const { costs, dateActive } = this;
            const thisYear = dateActive.substring(0, 4);
            const thisMonth = dateActive.substring(5, 7);
            return costs.filter(cost => cost.y === thisYear && cost.m === thisMonth);
        },
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
        costsYear: function() {
            const { costs, dateActive } = this;
            const thisYear = dateActive.substring(0, 4);
            return costs.filter(cost => cost.y === thisYear);
        },
        totalYear: function() {
            const { costsYear } = this;
            return costsYear.reduce((a, b) => a + parseInt(b.price, 10), 0);
        },
    },
    mounted: function() {
        firebase.auth().onAuthStateChanged(user => {
            if (user) {
                this.uid = user.uid;
                this.email = user.email;
                this.displayName = user.displayName;
                this.getData();
                this.getCosts();
            } else {
                ui.start('#firebaseui-auth-container', uiConfig);
            }
        });
        this.a2hs();
    },
    methods: {
        addOldCost: function() {
            const costs = [{
                price: 100,
                name: '111',
                date: '2022-04-23',
                tags: [],
            },
            {
                price: 100,
                name: '222',
                date: '2022-04-23',
                tags: ['肉弟', '交通'],
            }]
            db.collection('users').doc(this.uid).update({ costs, });
        },
        moveOldCosts: function() {
            const { uid, oldCosts } = this;
            oldCosts.map(cost => {
                const { date, name, price, tags } = cost;
                const y = date.substring(0, 4);
                const m = date.substring(5, 7);
                const d = date.substring(8, 10);
                const newCost = { userID: uid, name, price , tags, y, m, d };
                console.log(newCost)
                db.collection('costs').add(newCost)
                    .then(docRef => {
                        //data.id = docRef.id;
                        //this.costs.push(data);
                        //notice(`${name} 已新增`, 'success');
                    })
                    .catch(error => {
                        console.error("Error adding document: ", error);
                    });
            })
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
                    const { tags, costs } = doc.data();
                    if (tags.length) this.tags = tags;
                    this.oldCosts = costs;
                } else {
                    db.collection('users').doc(uid).set({ tags: [], costs: [] });
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
            const { uid, costActive, tagsActive } = this;
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
                        this.costs.splice(index, 1, data);
                        notice(`${name} 已更新`, 'success');
                    })
                    .catch(error => {
                        console.error("Error adding document: ", error);
                    });
            }
            return db.collection('costs').add(data)
                .then(docRef => {
                    data.id = docRef.id;
                    this.costs.push(data);
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
                    const index = this.costs.findIndex(cost => cost.id === id);
                    this.costs.splice(index, 1);
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
        changeDateActive: function(month) {
            const date = new Date(this.dateActive);
            const yyyy = date.getFullYear();
            const mm = date.getMonth();
            const dd = date.getDate();
            let newDate = null;
            if (mm === 11 && month === 1) {
                newDate = new Date(yyyy + 1, 0, dd);
            } else if (mm === 0 && month === -1) {
                newDate = new Date(yyyy - 1, 11, dd);
            } else {
                newDate = new Date(yyyy, mm + month, dd);
            }
            this.dateActive = dateString(newDate);
        },
        changeInputDate: function(day) {
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




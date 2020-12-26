import { firebaseConfig, uiConfig } from './config.js';
import { dateString, notice, isValidDate } from './functions.js';
// Initialize Firebase
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
        editCostType: 'add',
        costActiveId: null,
        tags: ['食物', '家用', '交通'],
        tagsActive: [],
        tagsFilter: [],
        formCost: {
            date: dateString(),
            name: '',
            price: null,
        },
        newTagName: '',
        isEditCost: false,
        isEditTag: false,
        isSettings: false,
        dateActive: dateString(),
    },
    computed: {
        costSubmitText: function() {
            const { editCostType } = this;
            let text = '新增';
            if (editCostType === 'put') text = '修改';
            return text;
        },
        costsMonth: function() {
            const { costs, dateActive } = this;
            return costs.filter(cost => cost.date.substring(0, 7) === dateActive.substring(0, 7));
        },
        totalMonth: function() {
            const { costsMonth } = this;
            return costsMonth.reduce((a, b) => a + parseInt(b.price, 10), 0);
        },
        tagsTotal: function() {
            const { costsMonth } = this;
            let allTags = [];
            costsMonth.map(cost => cost.tags.map(tag => allTags.push(tag)));
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
                const { id, date, name, price, tags } = cost;
                const index = target.findIndex(item => item.date === date);
                if (index === -1) {
                    target.push({
                        date,
                        list: [{ id, name, price, tags, }],
                    });
                } else {
                    target[index].list.push({ id, name, price, tags, });
                }
            });
            target.map(item => {
                const dayTotal = item.list.reduce((a, b) => a + parseInt(b.price), 0);
                item.total = dayTotal;
            });
            target.sort((a,b) => a.date.localeCompare(b.date));
            return target;
        },
        costsYear: function() {
            const { costs, dateActive } = this;
            return costs.filter(cost => cost.date.substring(0, 4) === dateActive.substring(0, 4));
        },
        totalYear: function() {
            const { costsYear } = this;
            return costsYear.reduce((a, b) => a + parseInt(b.price, 10), 0);
        },
    },
    mounted: function() {
        const self = this;
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                self.uid = user.uid;
                self.email = user.email;
                self.displayName = user.displayName;
                self.getData();
            } else {
                ui.start('#firebaseui-auth-container', uiConfig);
            }
        });
    },
    methods: {
        getData: function() {
            const { uid } = this;
            db.collection('users').doc(uid).get().then(doc => {
                if (doc.exists) {
                    const { tags, costs } = doc.data();
                    if (tags.length) this.tags = tags;
                    this.costsOrigin = costs;
                    costs.map((cost, index) => cost.id = index);
                    this.costs = costs;
                } else {
                    db.collection('users').doc(uid).set({ tags: [], costs: [] });
                }
            });
            this.a2hs();
        },
        a2hs: function() {
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('service-worker.js')
                    .then(reg => console.log(reg))
                    .catch(err => console.log(err));
            }
            window.addEventListener('beforeinstallprompt', function(e) {
                e.userChoice.then((choiceResult) => {
                    choiceResult.outcome === 'dismissed' ? console.log('User cancelled home screen install') : console.log('User added to home screen');
                });
            });
        },
        handleEdit: function() {
            this.isEditCost = !this.isEditCost;
            this.costActiveId = null;
            this.editCostType = 'add';
        },
        editCost: function(type, id=0, date="", name="", price=0, tags=[]) {
            this.isEditCost = true;
            this.editCostType = type;
            if (type === 'put') {
                this.costActiveId = id;
                this.formCost = { date, name, price };
                this.tagsActive = tags;
            }
        },
        updateCost: function(type) {
            const { uid, formCost, tagsActive, costsOrigin } = this;
            const newCost = Object.assign(formCost, { tags: tagsActive });
            if (type === 'put' || type === 'delete') costsOrigin.splice(this.costActiveId, 1);
            if (type === 'put' || type === 'add') costsOrigin.push(newCost);
            db.collection('users').doc(uid).update({ costs: costsOrigin })
            .then(() => {
                let text = '新增成功';
                this.getData();
                this.costActiveId = null;
                if (type === 'put') text = '修改成功';
                if (type === 'delete') {
                    text = '刪除成功';
                    this.isEditCost = false;
                }
                notice(text, 'success');
            })
            .catch(error => {
                notice(`更新失敗：${error}`);
            });
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
            const date = new Date(this.formCost.date);
            let newDate = new Date(date.getTime() + day * 86400 * 1000);
            if (!isValidDate(date)) newDate = new Date();
            this.$set(this.formCost, 'date', dateString(newDate)); 
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




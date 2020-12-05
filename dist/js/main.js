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
        isAddTag: false,
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
            const self = this;
            db.collection('users').doc(uid).get().then(doc => {
                if (doc.exists) {
                    const { tags, costs } = doc.data();
                    self.tags = tags;
                    self.costsOrigin = JSON.parse(JSON.stringify(costs));
                    costs.map((cost, index) => cost.id = index);
                    self.costs = costs;
                } else {
                    db.collection('users').doc(uid).set({ tags: [], costs: [] });
                }
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
                notice('更新成功', 'success');
                this.getData();
                this.costActiveId = null;
                this.isEditCost = false;
            })
            .catch(error => {
                notice(`更新失敗：${error}`);
            });
        },
        addTag: function() {
            const { uid, tags, newTagName } = this;
            if (tags.includes(newTagName)) return notice('標籤已經存在');
            const self = this;
            tags.push(newTagName);
            db.collection('users').doc(uid).update({ tags })
            .then(() => {
                notice('新增標籤成功', 'success')
                self.getData();
                self.tagsActive = [];
            })
            .catch(error => {
                notice(`新增標籤失敗：${error}`);
                tagsOrigin.splice(-1, 1);
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
            }).catch(function(error) {
                notice(`error: ${error}`, 'error', false);
            });
        },
        nc: function(x) {
            return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
    },
});




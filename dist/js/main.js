import { firebaseConfig, uiConfig } from './config.js';
import { getToday, notice } from './functions.js';
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
        formCost: {
            date: getToday(),
            name: '',
            price: null,
        },
        newTagName: '',
        isEdit: false,
        isAddTag: false,
        dateActive: getToday(),
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
            const sameDateCosts = costs.filter(cost => cost.date.substring(0, 7) === dateActive.substring(0, 7));
            const monthTotal = sameDateCosts.reduce((a, b) => a + parseInt(b.price, 10), 0);
            let allTags = [];
            sameDateCosts.map(cost => cost.tags.map(tag => allTags.push(tag)));
            allTags = Array.from(new Set(allTags));
            let tagsTotal = [];
            allTags.map(tag => {
                const sameTagCosts = sameDateCosts.filter(cost => cost.tags.includes(tag));
                const total = sameTagCosts.reduce((a ,b) => a + parseInt(b.price), 0);
                tagsTotal.push({
                    name: tag,
                    total, 
                });
            });
            let dateCosts = [];
            sameDateCosts.map(cost => {
                const { id, date, name, price, tags } = cost;
                const index = dateCosts.findIndex(item => item.date === date);
                if (index === -1) {
                    dateCosts.push({
                        date,
                        list: [{ id, name, price, tags, }],
                    });
                } else {
                    dateCosts[index].list.push({ id, name, price, tags, });
                }
            });
            dateCosts.map(item => {
                const dayTotal = item.list.reduce((a, b) => a + parseInt(b.price), 0);
                item.total = dayTotal;
            });
            const newCosts = {
                total: monthTotal,
                count: sameDateCosts.length,
                costs: dateCosts,
                tagsTotal,
            }
            return newCosts;
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
        editCost: function(type, id=0, date="", name="", price=0, tags=[]) {
            this.isEdit = true;
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
        toggleTag: function(tag) {
            const index = this.tagsActive.findIndex(item => item === tag);
            index === -1 ? this.tagsActive.push(tag) : this.tagsActive.splice(index, 1);
        },
        changeDate: function(type) {
            const { dateActive } = this;
            let yyyy = parseInt(dateActive.substring(0, 4), 10);
            let MM = parseInt(dateActive.substring(5, 7), 10);
            let dd = dateActive.substring(8, 10);
            if (type === 'prevMonth') {
                if (MM === 1) {
                    yyyy = yyyy - 1;
                    MM = 12;
                } else {
                    MM = MM - 1;
                }
            } else if (type === 'nextMonth') {
                if (MM === 12) {
                    yyyy = yyyy + 1;
                    MM = 1;
                } else {
                    MM = MM + 1;
                }
            }
            MM = `0${MM}`.slice(-2);
            this.dateActive = `${yyyy}-${MM}-${dd}`;
        },
        logout: function() {
            firebase.auth().signOut().then(function() {
                notice('登出成功', 'success');
            }).catch(function(error) {
                notice('發出錯誤');
            });
        },
    },
});



import { firebaseConfig, uiConfig } from './config.js'
import { dateString, notice, isValidDate } from './functions.js'
firebase.initializeApp(firebaseConfig)
firebase.analytics()
const ui = new firebaseui.auth.AuthUI(firebase.auth())
const db = firebase.firestore()
const d = new Date()
const thisYear = '' + d.getFullYear()
const thisMonth = `0${d.getMonth() + 1}`.slice(-2)

const app = new Vue({
    el: '#app',
    data: {
        user: {},
        uid: '',
        email: '',
        displayName: 'guest',
        year: thisYear,
        month: thisMonth,
        costsMonth: [],
        costActive: {},
        names: ['全聯', '超商', '飯', '麵', '麵包', '飲料', '停車費', '加油', '房貸', '健保費'],
        tags: ['食', '衣', '住', '行', '育', '樂'],
        tagsActive: [],
        tagsFilter: [],
        newTagName: '',
        isEditCost: false,
        isEditTag: false,
        isSettings: false,
        isReport: false,
        isUpdateReport: false,
        reportData: [],
        reportTags: [],
        reportTotal: 0,
        changeMonthTimer: null,
    },
    computed: {
        totalMonth: function() {
            const { costsMonth } = this
            if (!costsMonth) return 0
            return costsMonth.reduce((sum, cost) => sum + (parseInt(cost.price, 10) || 0), 0)
        },
        tagsTotal: function() {
            const { costsMonth } = this
            if (!costsMonth) return []
            const tagTotals = costsMonth.reduce((acc, cost) => {
                cost.tags.forEach(tag => acc[tag] = (acc[tag] || 0) + parseInt(cost.price, 10))
                return acc
            }, {})
            return Object.entries(tagTotals).map(([name, total]) => ({ name, total }))
        },
        costsList: function() {
            const { costsMonth, tagsFilter } = this
            const newCostsMonth = JSON.parse(JSON.stringify(costsMonth))
            const filteredCosts = tagsFilter.length
                ? newCostsMonth.filter(cost => cost.tags.some(tag => tagsFilter.includes(tag)))
                : newCostsMonth
            const result = filteredCosts.reduce((acc, cost) => {
                const { id, y, m, d, name, price, tags } = cost
                const daysOfWeek = ['日', '一', '二', '三', '四', '五', '六']
                const date = new Date(`${y}-${m}-${d}`)
                const day = daysOfWeek[date.getDay()]
                const index = acc.findIndex(item => item.d === d)
                const costEntry = { id, name, price: parseInt(price, 10), tags, y, m, d }
                if (index === -1) {
                    acc.push({
                        d,
                        day,
                        list: [costEntry],
                        total: costEntry.price
                    });
                } else {
                    acc[index].list.push(costEntry)
                    acc[index].total += costEntry.price
                }
                return acc
            }, [])
            result.sort((a, b) => a.d.localeCompare(b.d))
            return result
        },
        reportSort: function() {
            const { reportData } = this
            return reportData.sort((a, b) => b.price - a.price)
        }
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
        console.log('start')
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
                    this.user = doc.data();
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
                const data = { date: dateString(), name: '' };
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
                        const index = this.costsMonth.findIndex(cost => cost.id === id);
                        data.id = id;
                        if (index !== -1) this.costsMonth.splice(index, 1, data);
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
                    if (index !== -1) this.costsMonth.splice(index, 1);
                    this.isEditCost = false;
                    this.costActive = {};
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
            clearTimeout(this.changeMonthTimer)
            this.changeMonthTimer = setTimeout(() => {
                this.getCostsMonth()
            }, 300)
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
        },
        handleReport: function() {
            let { user: { updateReportTime, report }, } = this;
            updateReportTime = updateReportTime || 0;
            if (report && report.total) {
                this.reportData = report.data;
                this.reportTotal = report.total;
                this.reportTags = report.tagsData;
            }
            if (Date.now() - updateReportTime > 30 * 24 * 60 * 60 * 1000) {
                this.isUpdateReport = true;
            }
            this.isReport = true;
        },
        updateReport: function() {
            const { uid, year, tags } = this;
            let result = [];
            let tagsData = [];
            tags.map(tag => tagsData.push({ name: tag, total: 0 }));
            let total = 0;
            db.collection('costs').where('userID', '==', uid).where('y', '==', year).get()
                .then((querySnapshot) => {
                    querySnapshot.forEach((doc) => {
                        const { name, price, tags } = doc.data();
                        const target = result.find(item => item.name === name);
                        if (target) {
                            target.price += price;
                        } else {
                            result.push({ name, price });
                        }
                        tags.map(tag => {
                            const targetTag = tagsData.find(item => item.name === tag);
                            if (targetTag) targetTag.total += price;
                        })
                        total += price;
                    });
                    this.reportData = result;
                    this.reportTotal = total;
                    this.reportTags = tagsData;
                    setTimeout(() => {
                        db.collection('users').doc(uid).update({ report: { data: result, tagsData, total, }, updateReportTime: Date.now(), });
                    }, 3000 );
                    this.isUpdateReport = false;
                })
                .catch((error) => {
                    console.log("Error getting documents: ", error);
                });
        }
    },
});




const moment = require('moment');
const res = moment('20.01.2018','DD/MM/YYYY').locale('ru');
console.log(res.format('D MMMM YYYY'))
const path = require('path');
console.log(path.resolve(__dirname,'kek', 'index.html'))
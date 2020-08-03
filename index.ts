import  {promises as fs} from 'fs';
import * as moment from 'moment';

const handlebars = require('handlebars');
const phantom = require('phantom');
const express = require('express');
const app = express();
app.use(express.static('./public'));

(async function main(){
   const html = await fs.readFile('./public/template.html','utf-8');
   const template = handlebars.compile(html);
   const htmlApplication = template({
    last_name: 'Галиновский',
    first_name: 'Максим',
    middle_name: 'Андреевич',
    series: 'MP',
    number: '12312444',
    authority: 'ROVD kek FDF',
    date_of_issue: moment().locale('ru').format('D MMMM YYYY'),
    sign_date: moment().locale('ru').format('D MMMM YYYY'),
    signature: 'https://api.vmesteapp.by/data/QEiNhYgNpmUKznQQ.jpg'
   });

   await fs.writeFile('./public/htmlTempalte.html',htmlApplication);

    await new Promise((res) =>{
        app.listen(4000,() => {
            console.log('kek');
        res();
        });
    })
    
    const phantomInstance = await phantom.create();
    const page = await phantomInstance.createPage();
    await page.property('viewportSize',{
        width: 550,
        height: 550
    } );
    await page.open('http://localhost:4000/htmlTempalte.html');

    await page.render('./kek.pdf');
    console.log(11)
    await phantomInstance.exit();
})().catch(e => console.log(e))

export interface IPassportCreation {
    user_id: number;
    first_name: string;
    last_name: string;
    middle_name: string;
    number: string;
    authority: string;
    date_of_issue: string;
    city: string;
    city_type: string;
    street: string;
    building: string;
    corps: string | null;
    apartment: string | null;
    main_photo: string;
    registration_photo: string;
  }
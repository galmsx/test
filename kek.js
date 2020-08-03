/**
 * Created by cedric on 04/11/2014.
 */

/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

/**
 * Deep merge two objects.
 * @param target
 * @param ...sources
 */
function mergeDeep(target, ...sources) {
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) Object.assign(target, { [key]: {} });
                mergeDeep(target[key], source[key]);
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }

    return mergeDeep(target, ...sources);
}


function calcTime(offset) {
    // create Date object for current location
    var d = new Date();

    // convert to msec
    // subtract local time zone offset
    // get UTC time in msec
    var utc = d.getTime() + (d.getTimezoneOffset() * 60000);

    // create new Date object for different city
    // using supplied offset
    return new Date(utc + (3600000*offset));
}

function jsonpCallbackProperty(state, data) {

    var index = parseInt(data.element);
    var widget = widgetHelper.list[index - 1];

    if (typeof widget == "undefined") {
        widget = widgetHelper.list[0];
    }

    if(widget.config.valuesByDefaults && widget.config.valuesByDefaults.guests.value) {
        widget.fields.guests.value = parseInt(widget.config.valuesByDefaults.guests.value);
    }

    widget.property = data;

    if (widget.property.onlyCheckInOnDay) {
        widget.property.onlyCheckInOnDay = widget.property.onlyCheckInOnDay.replace("7", "0").split(";")
    }

    if(widget.config.showAvailability) {
        widgetHelper.getNotAvailableDates(widget);
    } else {

        widget.init();
        widget.setDatesDefaultValue();
    }
}

function jsonpCallbackDiscountCode(state, data) {

    var index = parseInt(data.element);
    var widget = widgetHelper.list[index - 1];

    if (typeof widget === "undefined") {
        widget = widgetHelper.list[0];
    }

    if (!state) {
        var errordates = widget.element.getElementsByClassName("orbirental-capture-widget-error-coupon")[0];
        errordates.innerHTML = data.message;
        widget.updateDynamicPricingOption();
    } else {
        widget.updateDynamicPricingOption();
    }
}

function jsonpCallbackLead(state, data) {

    var index = parseInt(data.element);
    var widget = widgetHelper.list[index - 1];

    if (typeof widget == "undefined") {
        widget = widgetHelper.list[0];
    }

    if(state) {

        var button = widget.element.getElementsByTagName("button")[0];
        button.innerHTML = widget.templates.label.thanks;
        button.style.backgroundColor = widget.config.backgroundColor;
        button.style.color = widget.config.buttonSubmit.backgroundColor;

        //Save Cookie
        if(widget.config.saveCookie) {
            widgetHelper.setCookie("name", data.name);
            widgetHelper.setCookie("guests", data.guests);
            widgetHelper.setCookie("checkIn", data.checkIn);
            widgetHelper.setCookie("checkOut", data.checkOut);
            widgetHelper.setCookie("email", data.email);
            widgetHelper.setCookie("notes", data.notes);
            widgetHelper.setCookie("phone", data.phone);
        }
    }
    return false;
}

function jsonpCallbackQuote(state, data) {

    var index = parseInt(data.element);
    var widget = widgetHelper.list[index - 1];

    if (typeof widget === "undefined") {
        widget = widgetHelper.list[0];
    }

    if(state) {

        if (widget.config.showPriceDetailsLink) {

            var link = widget.element.getElementsByClassName("orbirental-capture-widget-details-link")[0];
            link.style.display = "block";

            //Empty widget-quote
            var oldQuotes = widget.element.getElementsByClassName("orbirental-capture-widget-quote");

            for (var i = 0; i < oldQuotes.length; i++) {

                oldQuotes[i].parentNode.removeChild(oldQuotes[i]);
            }

            //create and put the quote after the link
            var quoteElement = widget.buildQuoteElement(data);
            link.parentNode.insertBefore(quoteElement, link.nextSibling);
        }

        if (widget.config.showGetQuoteLink && widget.property.acceptInstantBooking) {

            var link = widget.element.getElementsByClassName("orbirental-capture-widget-quote-link")[0];
            link.style.display = "block";
        }

        if (widget.config.minStay && widget.config.showDynamicMinStay && data.minimumStay) {

            var minimumStaySpan = widget.element.getElementsByClassName("minimum-stay-span")[0];
            minimumStaySpan.innerHTML = data.minimumStay;
        }


        //Header
        if (widget.config.price) {

            var wrapper = widget.element.getElementsByClassName("orbirental-capture-widget-price-option")[0];
            var p = wrapper.getElementsByTagName("p")[0];

            //Udpate price
            if (typeof data.discountCode === "undefined") {
                var string = widget.templates.label.amount;
                var priceFormat = widget.formatPrice((widget.config.showTotalWithoutSD) ? data.totalWithTaxesWithoutSD : data.totalWithTaxes, widget.property.currencySymbol);

                string = string.replace("%D%", priceFormat);
                p.innerHTML = string;
            } else {
                var string = widget.templates.label.amountdiscount;
                var priceFormat = widget.formatPrice((widget.config.showTotalWithoutSD) ? data.totalWithTaxesWithoutSD : data.totalWithTaxes, widget.property.currencySymbol);
                var priceBeforeDiscountFormat = widget.formatPrice((widget.config.showTotalWithoutSD) ? data.totalWithTaxesWithoutDiscountANDSD : data.totalWithTaxesWithoutDiscount, widget.property.currencySymbol);

                string = string.replace("%F%", priceFormat);
                string = string.replace("%D%", priceBeforeDiscountFormat);
                p.innerHTML = string;
            }

            //Update nights
            var wrapperNights = widget.element.getElementsByClassName("orbirental-capture-widget-totalnights")[0];
            var wrapperNightsP = wrapperNights.getElementsByTagName("p")[0];
            var wrapperNightsString = widget.templates.label.totalnights;
            wrapperNightsString = wrapperNightsString.replace("%E%", data.totalNights);
            wrapperNightsP.innerHTML = wrapperNightsString;
        }

        if (widget.config.price && widget.config.showDiscount) {
            var wrapperNights = widget.element.getElementsByClassName("orbirental-capture-widget-totalnights")[0];
            var p = wrapperNights.getElementsByTagName("p")[0];
            p.innerHTML += typeof data.discount != "undefined" ? "</br>(<b>" + data.discount + "</b> " + widget.templates.label.discount + ")" : "";
        }
    }

    return false;
}

function jsonpCallbackGetNotAvailableDates(data) {

    var index = parseInt(data.element);
    var widget = widgetHelper.list[index - 1];

    if (typeof widget == "undefined") {
        widget = widgetHelper.list[0];
    }

    var notAvailableDatesForCheckIn = [];
    var notAvailableDatesForCheckOut = [];

    for(var i = 0; i < data.checkIn.length; i++) {
        notAvailableDatesForCheckIn.push(data.checkIn[i]);
    }

    for(var i = 0; i < data.checkOut.length; i++) {
        notAvailableDatesForCheckOut.push(data.checkOut[i]);
    }

    widget.notAvailableDatesForCheckIn = notAvailableDatesForCheckIn;
    widget.notAvailableDatesForCheckOut = notAvailableDatesForCheckOut;

    widget.init();
    widget.setDatesDefaultValue();
}

var dictionary = {
    US : {
        placeholder : {
            checkIn     : "Check-in",
            checkOut    : "Check-out",
            guests      : "Guests",
            email       : "Email",
            name        : "Name",
            phone       : "Phone",
            notes       : "Enter a brief message",
            discountCode: "Discount Code"
        },
        label : {
            price           : "From <span class='orbirental-capture-widget-price'>%D%</span></br> per night",
            amount          : "<span class='orbirental-capture-widget-price'>%D%</span>",
            amountdiscount  : "<span class='orbirental-capture-widget-price orbirental-capture-widget-discount'>%D%</span><span class='orbirental-capture-widget-price'>%F%</span>",
            totalnights     : "Total for %E% nights",
            stay            : "Min stay: %D% nights",
            guests          : "guests",
            nights          : "nights",
            thanks          : "Thank You!",
            discount        : "discount",
            showdetails     : "Show details",
            hidedetails     : "Hide details"
        },
        quote: {
            rent            : "Rent",
            extraguests     : "Extra Guests",
            discount        : "Discount",
            taxes           : "Taxes",
            subtotal        : "Sub-Total",
            fees            : "Fee(s)",
            cleaning        : "Cleaning",
            cleaningfeetaxes: "Cleaning fee taxes",
            taxesof         : "'s taxes",
            securitydeposit : "Security Deposit",
            refundable      : "Refundable",
            total           : "Total"
        },
        i18n: {
            previousMonth : 'Previous Month',
            nextMonth     : 'Next Month',
            months        : ['January','February','March','April','May','June','July','August','September','October','November','December'],
            weekdays      : ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
            weekdaysShort : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
        }
    },
    FR : {
        placeholder : {
            checkIn         : "ArrivГ©e",
            checkOut        : "DГ©part",
            email           : "Email",
            name            : "Nom",
            phone           : "TГ©lГ©phone",
            notes           : "Ecrire un message",
            discountCode    : "Remise"
        },
        label : {
            price           : "A partir de <span class='orbirental-capture-widget-price'>%D%</span></br> par nuit",
            amount          : "<span class='orbirental-capture-widget-price'>%D%</span>",
            amountdiscount  : "<span class='orbirental-capture-widget-price orbirental-capture-widget-discount'>%D%</span><span class='orbirental-capture-widget-price'>%F%</span>",
            totalnights     : "Total pour %E% nuits",
            stay            : "%D% nuits minimun",
            guests          : "voyageurs",
            nights          : "nuits",
            thanks          : "Merci!",
            discount        : "de remise",
            showdetails     : "Details",
            hidedetails     : "Cacher details"
        },
        quote: {
            rent            : "LoyГ©",
            extraguests     : "SupplГ©ment par locataire",
            discount        : "Remise",
            taxes           : "Taxes",
            subtotal        : "Sous-total",
            fees            : "Charge(s)",
            cleaning        : "Frais de nettoyage",
            cleaningfeetaxes: "Taxes nettoyage",
            taxesof         : " taxes",
            securitydeposit : "Caution",
            refundable      : "Remboursable",
            total           : "Total"
        },
        i18n: {
            previousMonth : 'Mois prГ©cГ©dent',
            nextMonth     : 'Mois prochain',
            months        : ['Janvier','FГ©vrier','Mars','Avril','Mai','Juin','Juillet','Aout','Septembre','October','Novembre','DГ©cembre'],
            weekdays      : ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'],
            weekdaysShort : ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam']
        }
    },
    ES : {
        placeholder : {
            checkIn         : "Check-in",
            checkOut        : "Check-out",
            guests          : "Huespedes",
            email           : "Email",
            name            : "Nombre",
            phone           : "Telefono",
            notes           : "Ingrese un mensaje breve",
            discountCode    : "Discount Code"
        },
        label : {
            price           : "Desde <span class='orbirental-capture-widget-price'>%D%</span></br> por noche",
            amount          : "<span class='orbirental-capture-widget-price'>%D%</span><br/> Total por %E% noches",
            amountdiscount  : "<span class='orbirental-capture-widget-price orbirental-capture-widget-discount'>%D%</span><span class='orbirental-capture-widget-price'>%F%</span><br/> Total por %E% noches",
            stay            : "Estadia Minima: %D% noches",
            guests          : "huespedes",
            nights          : "noches",
            thanks          : "ВЎGracias!",
            discount        : "descuento",
            showdetails     : "Show details",
            hidedetails     : "Hide details"
        },
        quote: {
            rent            : "Aluguel",
            extraguests     : "Valor por hospede adicional",
            discount        : "Remise",
            taxes           : "Impuestos",
            subtotal        : "Subtotal",
            fees            : "Tarifas",
            cleaning        : "Tarifa de limpeza",
            cleaningfeetaxes: "Imposto sobre tarifa de limpeza",
            taxesof         : " impuestos",
            securitydeposit : "Desconto",
            refundable      : "Remboursable",
            total           : "Total"
        },
        i18n: {
            previousMonth : 'Mes Anterior',
            nextMonth     : 'Mes Siguiente',
            months        : ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julop','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
            weekdays      : ['Domingo','Lunes','Martes','Miercoles','Jueves','Viernes','Sabado'],
            weekdaysShort : ['Dom','Lun','Mar','Mier','Jue','Vie','Sab']
        }
    }
};

var defaultConfig = {
    type : "agency",
    fields : [],
    showAvailability : false,
    lang : "US", //US or FR or object
    minStay:false, //False or value
    price:false, //False or value
    cc: false, //False or value,
    emailClient : false, //False or value,
    saveCookie : true, //False or value,
    showDynamicMinStay : true, //False or value,
    backgroundColor: "#FFFFFF",
    buttonSubmit: {
        label: "Get a Quote",
        backgroundColor: "#F8981B"
    },
    showPriceDetailsLink: false,
    showGetQuoteLink: false,
    labelColor: "#F8981B",
    showTotalWithoutSD: true,
    redirectURL: false,
    showDiscount: true,
    includeReferrerToRequest: true,
    customDomainName: null,
    source: null, //set the lead source
    aid: null, //set the aid
    clickID: null,
    valuesByDefaults: {
        "checkIn": {
            value: ""
        },
        "checkOut": {
            value: ""
        },
        "guests": {
            value: ""
        }
    }
};

var allFields = {
    "phone": {
        isOptional: true,
        element: "input",
        wrapperClass: "orbirental-capture-widget-wrapper "
    },
    "notes": {
        isOptional: true,
        element: "textarea",
        wrapperClass: "orbirental-capture-widget-wrapper "
    },
    "checkIn": {
        isOptional: false,
        element: "input",
        wrapperClass: "orbirental-capture-checkin orbirental-capture-widget-wrapper small orbirental-capture-widget-datepicker",
        required: true,
        value: ""
    },
    "checkOut": {
        isOptional: false,
        element: "input",
        wrapperClass: "orbirental-capture-checkout orbirental-capture-widget-wrapper small orbirental-capture-widget-datepicker",
        required: true,
        value: ""
    },
    "guests": {
        isOptional: false,
        element: "select",
        wrapperClass: "orbirental-capture-guests orbirental-capture-widget-wrapper",
        value: 1
    },
    "email": {
        isOptional: false,
        element: "input",
        wrapperClass: "orbirental-capture-widget-wrapper ",
        required: true,
        type: "email"
    },
    "name": {
        isOptional: false,
        element: "input",
        wrapperClass: "orbirental-capture-widget-wrapper ",
        required: true
    },
    "discountCode": {
        isOptional: true,
        element: "input",
        wrapperClass: "orbirental-capture-widget-wrapper orbirental-capture-coupon ",
        value: "",
        autocomplete: "off"
    }
};

WidgetHelper.prototype.list = [];
WidgetHelper.prototype.setCookie = function (cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + escape(cvalue) + "; " + expires + ";path=/";
};
WidgetHelper.prototype.getCookie = function (cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i];
        c = unescape(c);
        while (c.charAt(0)==' ') c = c.substring(1);
        if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
    }
    return null;
};

Widget.prototype.element = null;
Widget.prototype.templates = null;
Widget.prototype.inactive = false;
Widget.prototype.notAvailableDatesForCheckIn = [];
Widget.prototype.notAvailableDatesForCheckOut = [];
Widget.prototype.lastDateAvailableForCheckout = null;
Widget.prototype.property = null;
Widget.prototype.propertyUID = null;
Widget.prototype.form = null;
Widget.prototype.fields = null;
Widget.prototype.config = null;
Widget.prototype.quoteHasBeenSend = false;
Widget.prototype.index = -1;

function Widget(_element, propertyUID, config) {

    var element = document.getElementById(_element);
    element.classList.add('leadWidget');

    widgetHelper = new WidgetHelper();
    /*
     Merge Option
     */
    this.config = Object.assign({}, defaultConfig);

    for (var attrname in config) {

        if (config.hasOwnProperty(attrname)) {

            if (typeof config[attrname] !== "undefined") {

                this.config[attrname] = config[attrname];
            }
        }
    }

    if (typeof config.pathRoot !== "undefined") {

        widgetHelper.pathRoot = config.pathRoot;
    } else {
        widgetHelper.pathRoot = "https://platform.hostfully.com/";
    }


    //Load CSS
    widgetHelper.loadCSS(widgetHelper.pathRoot + "assets/css/leadCaptureWidget_2.0.css?v=1.2");
    widgetHelper.loadCSS(widgetHelper.pathRoot + "assets/css/pikaday.css");

    //not optional fields
    this.fields = [];

    for (var attrname in allFields) {

        if (allFields.hasOwnProperty(attrname)) {

            if (!allFields[attrname].isOptional) {

                this.fields[attrname] = allFields[attrname];
            }
        }
    }


    for (var i = 0; i < this.config.fields.length; i++) {

        var field = this.config.fields[i];
        this.fields[field] = allFields[field];
    }


    this.element = element;
    this.templates = null;

    if (typeof this.config.lang === "string") {

        if (this.config.lang === "US" || this.config.lang === "FR" || this.config.lang === "ES") {
            this.templates = dictionary[this.config.lang];
        } else {
            this.templates = dictionary.US;
        }
    } else if (typeof this.config.lang === "object") {

        var langOptions = this.config.lang;
        var langDefault = dictionary.US;

        this.templates = mergeDeep(langDefault, langOptions);
    } else {
        this.templates = dictionary.US;
    }

    this.propertyUID = propertyUID;
    this.index = widgetHelper.list.length + 1;

    widgetHelper.getProperty(this);
    widgetHelper.list.push(this);

    return this;
}

function WidgetHelper() {
    'use strict';
}

Widget.prototype.setDatesDefaultValue = function () {

    //Trigger dates for label
    if(this.config.saveCookie) {
        if(widgetHelper.getCookie("checkIn") != null && widgetHelper.getCookie("checkOut") != null) {
            this.checkIn.setDate(widgetHelper.getCookie("checkIn"));
            this.checkOut.setDate(widgetHelper.getCookie("checkOut"));
        }
    }

    //Set default value
    if(this.config.valuesByDefaults && this.config.valuesByDefaults.checkIn.value) {
        var to = this.config.valuesByDefaults.checkIn.value.split("-");
        this.checkIn.setDate(new Date(to[0], to[1] - 1, to[2]));
    }

    if(this.config.valuesByDefaults && this.config.valuesByDefaults.checkOut.value) {
        var to = this.config.valuesByDefaults.checkOut.value.split("-");
        this.checkOut.setDate(new Date(to[0], to[1] - 1, to[2]));
    }
};

Widget.prototype.isIE = function() {
    var myNav = navigator.userAgent.toLowerCase();
    return (myNav.indexOf('msie') != -1) ? parseInt(myNav.split('msie')[1]) : false;
};

Widget.prototype.init = function() {
    this.destroy();

    //Set discount field if any
    if (this.property.discountCodes.length > 0) {
        this.fields["discountCode"] = allFields["discountCode"];
    }

    this.createForm();
    this.createFields();
    this.createOptions();
};

Widget.prototype.buildQuoteElement = function(data) {

    var quote = document.createDocumentFragment();

    var div = document.createElement("div");
    div.classList.add("orbirental-capture-widget-quote");

    var table = document.createElement("table");
    table.classList.add("hide-details");

    var row,
        cell1,
        cell2,
        cell3;

    //Rent
    if (data.rent > 0) {

        row = table.insertRow(-1);
        cell1 = row.insertCell(0);
        cell2 = row.insertCell(1);
        cell2.colSpan = 2;

        cell1.innerHTML = this.templates.quote.rent + ":";
        cell2.innerHTML = this.formatPrice(data.rent, this.property.currencySymbol);
    }

    //Extra guest fee
    if (data.extraGuestsFee > 0) {

        row = table.insertRow(-1);
        cell1 = row.insertCell(0);
        cell2 = row.insertCell(1);
        cell3 = row.insertCell(2);

        cell2.classList.add("gray");

        cell2.innerHTML = this.templates.quote.extraguests;
        cell3.innerHTML = this.formatPrice(data.extraGuestsFee, this.property.currencySymbol);
    }

    //Discount Code
    if (data.discountCode > 0) {

        row = table.insertRow(-1);
        cell1 = row.insertCell(0);
        cell2 = row.insertCell(1);
        cell3 = row.insertCell(2);

        cell2.classList.add("gray");

        cell2.innerHTML = this.templates.quote.discount;
        cell3.innerHTML = "- " + this.formatPrice(data.discountCode , this.property.currencySymbol);
    }

    //taxes
    if (data.taxationRateAmount > 0) {

        row = table.insertRow(-1);
        cell1 = row.insertCell(0);
        cell2 = row.insertCell(1);
        cell2.colSpan = 2;


        cell1.innerHTML = this.templates.quote.taxes + ":";
        cell2.innerHTML = this.formatPrice(data.taxationRateAmount, this.property.currencySymbol);
    }

    //sub total
    if (data.subtotal > 0) {
        row = table.insertRow(-1);
        cell1 = row.insertCell(0);
        cell2 = row.insertCell(1);
        cell2.colSpan = 2;

        cell1.className = "pre-warning";
        cell2.className = "pre-warning";

        cell1.innerHTML = this.templates.quote.subtotal + ":";
        cell2.innerHTML = this.formatPrice(data.subtotal, this.property.currencySymbol);
    }

    //Cleaning fee
    if (data.cleaningFeeAmount > 0) {

        row = table.insertRow(-1);
        cell1 = row.insertCell(0);
        cell2 = row.insertCell(1);
        cell3 = row.insertCell(2);

        cell2.classList.add("gray");

        cell1.innerHTML = this.templates.quote.fees + ":";
        cell2.innerHTML = this.templates.quote.cleaning;
        cell3.innerHTML = this.formatPrice(data.cleaningFeeAmount, this.property.currencySymbol);
    }

    //Cleaning fee taxes
    if (data.cleaningFeeTaxAmount > 0) {

        row = table.insertRow(-1);
        cell1 = row.insertCell(0);
        cell2 = row.insertCell(1);
        cell3 = row.insertCell(2);

        cell2.classList.add("gray");

        cell2.innerHTML = this.templates.quote.cleaningfeetaxes;
        cell3.innerHTML = this.formatPrice(data.cleaningFeeTaxAmount, this.property.currencySymbol);
    }

    //fees
    for (var index in data.fees) {

        if (data.fees.hasOwnProperty(index)) {
            var fee = data.fees[index];
            row = table.insertRow(-1);
            cell1 = row.insertCell(0);
            cell2 = row.insertCell(1);
            cell3 = row.insertCell(2);

            cell2.classList.add("gray");

            cell2.innerHTML = fee.name;
            cell3.innerHTML = this.formatPrice(fee.amount, this.property.currencySymbol);

            if (!isNaN(parseFloat(fee.taxAmount)) && parseFloat(fee.taxAmount) > 0) {

                row = table.insertRow(-1);
                cell1 = row.insertCell(0);
                cell2 = row.insertCell(1);
                cell3 = row.insertCell(2);

                cell2.classList.add("gray");

                cell2.innerHTML = fee.name + this.templates.quote.taxesof;
                cell3.innerHTML = this.formatPrice(fee.taxAmount, this.property.currencySymbol);
            }
        }
    }

    //taxes fee
    for (var index in data.taxes) {

        if (data.taxes.hasOwnProperty(index)) {
            row = table.insertRow(-1);
            cell1 = row.insertCell(0);
            cell2 = row.insertCell(1);
            cell2.colSpan = 2;


            cell1.innerHTML = data.taxes[index].name;
            cell2.innerHTML = this.formatPrice(data.taxes[index].amount, this.property.currencySymbol);
        }
    }

    //SD
    if (data.securityDepositAmount > 0/* && !widget.config.showTotalWithoutSD*/) {

        row = table.insertRow(-1);
        cell1 = row.insertCell(0);
        cell2 = row.insertCell(1);
        cell3 = row.insertCell(2);

        cell2.classList.add("gray");

        cell1.innerHTML = this.templates.quote.securitydeposit + ":";
        cell2.innerHTML = this.templates.quote.refundable;
        cell3.innerHTML = this.formatPrice(data.securityDepositAmount, this.property.currencySymbol);
    }

    //Total
    if (data.totalWithTaxes > 0) {

        row = table.insertRow(-1);
        cell1 = row.insertCell(0);
        cell2 = row.insertCell(1);
        cell2.colSpan = 2;

        cell1.className = "pre-warning";
        cell2.className = "pre-warning";

        cell1.innerHTML = this.templates.quote.total + ":";
        cell2.innerHTML = this.formatPrice((this.config.showTotalWithoutSD) ? data.totalWithTaxesWithoutSD : data.totalWithTaxes, this.property.currencySymbol);
    }

    div.appendChild(table);
    quote.appendChild(div);

    return quote;
};

Widget.prototype.createForm = function () {

    var _this = this;

    //create form
    var form = document.createElement("form");
    form.id = "orbirental-capture-widget-form-" + this.propertyUID;
    form.classList.add("orbirental-capture-widget-form");
    form.style.backgroundColor = this.config.backgroundColor;
    form.onsubmit = function (event) {

        _this.clearErrorsMessage();

        if (_this.config.type === "agency" && _this.property.acceptInstantBooking) {

            _this.sendInstantBooking();
        } else {

            _this.sendQuote();
        }

        return false;
    };

    //create submit button
    var buttonSubmit = document.createElement("button");
    buttonSubmit.type = "submit";
    buttonSubmit.style.backgroundColor = this.config.buttonSubmit.backgroundColor;
    buttonSubmit.innerHTML = (_this.property.acceptInstantBooking) ? "Book now" : "Get a Quote"; //TODO make labels configurable

    form.appendChild(buttonSubmit);

    //create send quote link
    if (this.config.showGetQuoteLink && this.property.acceptInstantBooking) {

        var showLinkWrap = document.createElement("p");
        showLinkWrap.classList.add("orbirental-capture-widget-wrapper");

        var showLinkQuote = document.createElement("a");
        showLinkQuote.innerHTML = "Get a quote";
        showLinkWrap.classList.add("orbirental-capture-widget-link");
        showLinkQuote.href = "#";
        showLinkQuote.id = "orbirental-capture-widget-quote-link";
        showLinkQuote.classList.add("orbirental-capture-widget-quote-link");
        showLinkQuote.style.display = "none";
        showLinkQuote.addEventListener("click", function (e) {

            e.preventDefault();

            if (_this.form.email.checkValidity()) {

                var result = _this.sendQuote();

                if (result) {
                    this.innerHTML = "Quote sent !";
                }
            } else {

                var submitForm = _this.form.getElementsByTagName("button")[0];

                submitForm.click();
            }


            return false;
        });

        showLinkWrap.appendChild(showLinkQuote);

        form.appendChild(showLinkWrap);
    }

    //create show details link
    if (this.config.showPriceDetailsLink) {

        //Link quote
        var showDetailsWrap = document.createElement("p");
        showDetailsWrap.classList.add("orbirental-capture-widget-wrapper");

        var showDetail = document.createElement("a");
        showDetail.innerHTML = this.templates.label.showdetails;
        showDetail.href = "#";
        showDetail.id = "orbirental-capture-widget-details-link";
        showDetail.classList.add("orbirental-capture-widget-link");
        showDetail.classList.add("orbirental-capture-widget-details-link");
        showDetail.style.display = "none";
        showDetail.addEventListener("click", function (e) {

            e.preventDefault();

            var quoteWrap = _this.element.getElementsByClassName("orbirental-capture-widget-quote")[0];
            var table = quoteWrap.getElementsByTagName("table")[0];

            if (table.classList.contains("hide-details")) {

                this.innerHTML = _this.templates.label.hidedetails;
                table.classList.remove("hide-details")
            } else {

                this.innerHTML = _this.templates.label.showdetails;
                table.classList.add("hide-details");
            }
        });

        showDetailsWrap.appendChild(showDetail);

        form.appendChild(showDetailsWrap);
    }


    this.form = form;
    this.element.appendChild(form);
};

Widget.prototype.sendInstantBooking = function () {

    if (this.inactive) {
        return false;
    }

    //Retrieve url
    var _this = this;
    var form = document.getElementById("orbirental-capture-widget-form-" + this.propertyUID);
    var uri;

    uri = "book.jsp?action=instantbooking";

    if (this.config.includeReferrerToRequest) {
        var referrer = window.location.hostname;
        if (referrer) {
            referrer = referrer.replace("www.", "")
        }
        uri += "&referrer=" + encodeURIComponent(referrer);
    }

    uri += "&agencyID=" + this.entrepriseID;
    uri += (form.discountCode) ? "&discountCode=" + encodeURIComponent(form.discountCode.value) : "";
    uri += "&checkIn=" + encodeURIComponent(form.checkIn.value);
    uri += "&checkOut=" + encodeURIComponent(form.checkOut.value);
    uri += "&guests=" + encodeURIComponent(form.guests.value);
    uri += "&email=" + encodeURIComponent(form.email.value);
    uri += "&name=" + encodeURIComponent(form.name.value);
    uri += "&guestPreferredLocale=" + (navigator.language || navigator.userLanguage);
    uri += (form.phone) ? "&phone=" + encodeURIComponent(form.phone.value) : "";
    uri += (form.notes) ? "&notes=" + encodeURIComponent(form.notes.value) : "";
    uri += (form.cc) ? "&cc=" + encodeURIComponent(form.cc.value) : "";
    uri += (form.emailClient) ? "&emailClient=" + encodeURIComponent(form.emailClient.value) : "";
    uri += (this.config.aid) ? "&aid=" + encodeURIComponent(this.config.aid) : "";
    uri += (this.config.clickID) ? "&clickID=" + encodeURIComponent(this.config.clickID) : "";
    uri += (this.config.source) ? "&source=" + encodeURIComponent(this.config.source) : "";
    uri += (this.config.isPropertyExternal) ? "&externalID=" + this.propertyUID : "&propertyUID=" + this.propertyUID;
    uri += (this.config.redirectURL) ? "&redirectURL=" + this.config.redirectURL : "";

    //Redirect to book.jsp if instant booking allowed
    var params = "?propuid=" + this.propertyUID;
    params += "&checkIn=" + form.checkIn.value;
    params += "&checkOut=" + form.checkOut.value;
    params += "&guests=" + form.guests.value;
    params += "&isPropertyExternal=" + (this.config.isPropertyExternal) ? true : false;
    params += "&agencyID=" + this.entrepriseID;
    params += "&" + (new Date()).getTime();

    var httpRequest = new XMLHttpRequest();
    httpRequest.open("GET", widgetHelper.pathRoot + "lead_checkvalidity_ajx.jsp" + params, true);
    httpRequest.onreadystatechange = function() {
        if (httpRequest.readyState === 4 && httpRequest.status === 200) {
            var data = JSON.parse(httpRequest.responseText);

            //Check if min stay is okay
            if (!data.isMinStayOkay){
                var errordates = _this.element.getElementsByClassName("orbirental-capture-widget-error-dates")[0];
                errordates.innerHTML = "Miminum stay requirement is not met.";
                return;
            };

            if (!data.isMaxStayOkay){
                var errordates = _this.element.getElementsByClassName("orbirental-capture-widget-error-dates")[0];
                errordates.innerHTML = "Maximum stay requirement is not met.";
                return;
            };

            //Check Availability
            if (!data.isAvailable){
                var errordates = _this.element.getElementsByClassName("orbirental-capture-widget-error-dates")[0];
                errordates.innerHTML = "The property is not available for those dates.";
                return;
            };

            //Check if guests is okay
            if (!data.isGuestsOkay){
                var errorguests = _this.element.getElementsByClassName("orbirental-capture-widget-error-guests")[0];
                errorguests.innerHTML = "Too many guests";
                return;
            };

            if (typeof data.isMaxDaysNoticeSatisfied != "undefined") {
                var errordates = _this.element.getElementsByClassName("orbirental-capture-widget-error-dates")[0];
                errordates.innerHTML = data.isMaxDaysNoticeSatisfied;
                return;
            }

            if (typeof data.isBookingLeadTimeSatisfied != "undefined") {
                var errordates = _this.element.getElementsByClassName("orbirental-capture-widget-error-dates")[0];
                errordates.innerHTML = data.isBookingLeadTimeSatisfied;
                return;
            }

            if (typeof data.isTurnOverDaysSatisfied != "undefined") {
                var errordates = _this.element.getElementsByClassName("orbirental-capture-widget-error-dates")[0];
                errordates.innerHTML = data.isTurnOverDaysSatisfied;
                return
            }

            if (typeof data.isBookingWindowAfterCheckoutSatisfied != "undefined") {
                var errordates = _this.element.getElementsByClassName("orbirental-capture-widget-error-dates")[0];
                errordates.innerHTML = data.isBookingWindowAfterCheckoutSatisfied;
                return
            }

            window.location = _this.config.customDomainName != null ?  _this.config.customDomainName + uri : widgetHelper.pathRoot + uri;

            return false;
        }
    };
    httpRequest.send(null);

};

Widget.prototype.sendQuote = function () {

    if (this.inactive || this.quoteHasBeenSend) {
        return false;
    }

    try {

        //Retrieve url
        var form = document.getElementById("orbirental-capture-widget-form-" + this.propertyUID);
        var uri;
        var _this = this;

        if (this.config.type === "agency") {
            uri = "leadCaptureWidget_process.jsp?jsoncallback=jsonpCallbackLead&element=" + this.index;
            uri += "&agencyID=" + this.entrepriseID;
        } else if (this.config.type === "owner") {
            uri = "owner/leadCaptureWidget_process.jsp?jsoncallback=jsonpCallbackLead";
            uri += "&ownerID=" + this.entrepriseID;
        }

        if (this.config.includeReferrerToRequest) {
            var referrer = window.location.hostname;
            if (referrer) {
                referrer = referrer.replace("www.", "")
            }
            uri += "&referrer=" + encodeURIComponent(referrer);
        }

        uri += (form.discountCode) ? "&discountCode=" + encodeURIComponent(form.discountCode.value) : "";
        uri += "&checkIn=" + encodeURIComponent(form.checkIn.value);
        uri += "&checkOut=" + encodeURIComponent(form.checkOut.value);
        uri += "&guests=" + encodeURIComponent(form.guests.value);
        uri += "&email=" + encodeURIComponent(form.email.value);
        uri += "&name=" + escape(form.name.value);
        uri += "&guestPreferredLocale=" + (navigator.language || navigator.userLanguage);
        uri += (form.phone) ? "&phone=" + encodeURIComponent(form.phone.value) : "";
        uri += (form.notes) ? "&notes=" + escape(form.notes.value) : "";
        uri += (form.cc) ? "&cc=" + encodeURIComponent(form.cc.value) : "";
        uri += (form.emailClient) ? "&emailClient=" + encodeURIComponent(form.emailClient.value) : "";
        uri += (this.config.aid) ? "&aid=" + encodeURIComponent(this.config.aid) : "";
        uri += (this.config.clickID) ? "&clickID=" + encodeURIComponent(this.config.clickID) : "";
        uri += (this.config.source) ? "&source=" + encodeURIComponent(this.config.source) : "";
        uri += (this.config.isPropertyExternal) ? "&externalID=" + this.propertyUID : "&propertyUID=" + this.propertyUID;

        var params = "?propuid=" + this.propertyUID;
        params += "&checkIn=" + form.checkIn.value;
        params += "&checkOut=" + form.checkOut.value;
        params += "&guests=" + form.guests.value;
        params += "&isPropertyExternal=" + (this.config.isPropertyExternal) ? true : false;
        params += "&agencyID=" + this.entrepriseID;
        params += "&" + (new Date()).getTime();

        var httpRequest = new XMLHttpRequest();
        httpRequest.open("GET", widgetHelper.pathRoot + "lead_checkvalidity_ajx.jsp" + params, true);
        httpRequest.onreadystatechange = function () {
            if (httpRequest.readyState === 4 && httpRequest.status === 200) {

                var data = JSON.parse(httpRequest.responseText);

                //Check if min stay is okay
                if (!data.isMinStayOkay) {
                    var errordates = _this.element.getElementsByClassName("orbirental-capture-widget-error-dates")[0];
                    errordates.innerHTML = "Mininum stay requirement is not met.";
                    return;
                }

                if (!data.isMaxStayOkay) {
                    var errordates = _this.element.getElementsByClassName("orbirental-capture-widget-error-dates")[0];
                    errordates.innerHTML = "Maximum stay requirement is not met.";
                    return;
                }

                //Check Availability
                if (_this.config.showAvailability && !data.isAvailable) {
                    var errordates = _this.element.getElementsByClassName("orbirental-capture-widget-error-dates")[0];
                    errordates.innerHTML = "The property is not available for those dates.";
                    return
                }

                //Check if guests is okay
                if (!data.isGuestsOkay) {
                    var errorguests = _this.element.getElementsByClassName("orbirental-capture-widget-error-guests")[0];
                    errorguests.innerHTML = "Too many guests";
                    return;
                }

                if (typeof data.isMaxDaysNoticeSatisfied != "undefined") {
                    var errordates = _this.element.getElementsByClassName("orbirental-capture-widget-error-dates")[0];
                    errordates.innerHTML = data.isMaxDaysNoticeSatisfied;
                    return
                }

                var script = document.createElement('script');
                script.src = widgetHelper.pathRoot + uri;
                document.getElementsByTagName('head')[0].appendChild(script);

                _this.quoteHasBeenSend = true;

                return false;
            }
        };

        httpRequest.send(null);

        return true;
    } catch (e) {
        console.log(e);
    }

    return false;
};

Widget.prototype.createOptions = function () {

    //we create the fields even if empty
    this.showMinStayOption();
    this.showNumberOfNights();
    this.showPriceOption();

    //add fields to form
    for(var prop in this.config) {
        if(this.config.hasOwnProperty(prop)) {

            if(this.config[prop] == false) {
                continue;
            }

            if(prop == "cc") {
                this.showCCOption(this.config.cc);
            } else if(prop == "emailClient") {
                this.showEmailClientOption(this.config.emailClient);
            }
        }
    }

    this.includeErrorsMessage();
};

Widget.prototype.createFields = function () {

    var submit = this.form.getElementsByTagName("button")[0];

    //add fields to form
    for(var prop in this.fields) {
        if(this.fields.hasOwnProperty(prop)) {
            var wrapperField = null;
            var field = this.fields[prop];

            if(field.element === "select") {
                wrapperField = this.getSelectElement(prop, field);
            } else if(field.element === "input") {
                wrapperField = this.getInputElement(prop, field);
            } else if(field.element === "textarea") {
                wrapperField = this.getTextareaElement(prop, field);
            }

            this.form.insertBefore(wrapperField, submit);
        }
    }
};

Widget.prototype.getInputElement = function (name, field) {
    var _this = this;
    var wrapperForm = document.createElement("div");
    var labelForm; //Add label if IE
    var elementForm = document.createElement("input");
    elementForm.name = name;

    if(field.wrapperID) {
        wrapperForm.id = field.wrapperID;
    }

    if(this.isIE()) { //Add label or placeholder
        labelForm = document.createElement("label");
        labelForm.innerHTML = this.templates.placeholder[name];
    } else {
        elementForm.placeholder = this.templates.placeholder[name];
        if(field.required) elementForm.placeholder = "*" + this.templates.placeholder[name];

    }

    if(field.required) {
        elementForm.required = true;
    }

    if(field.autocomplete) {
        elementForm.setAttribute('autocomplete', field.autocomplete);
    }

    if(field.type) {
        elementForm.setAttribute('type', field.type);
    } else {
        elementForm.setAttribute('type', 'text');
    }

    if(field.value) {
        elementForm.setAttribute('value', field.value);
    } else if(widgetHelper.getCookie(name) != null) {
        elementForm.setAttribute('value', widgetHelper.getCookie(name));
    } else {
        elementForm.setAttribute('value', "");
    }

    wrapperForm.className = "orbirental-capture-widget-wrapper";

    if(field.wrapperClass) {
        wrapperForm.className += " " + field.wrapperClass;

        if (field.wrapperClass.indexOf("orbirental-capture-widget-datepicker") !== -1) {

            var picker = new Pikaday({
                field: elementForm,
                i18n: _this.templates.i18n,
                format: 'YYYY-MM-DD',
                disableDayFn: function(theDate) {
                    var name = elementForm.getAttribute("name");

                    if(name === "checkIn") {
                        if (_this.isCheckinDisabled(theDate)) {
                            return true;
                        }
                    }

                    if(name === "checkOut") {
                        if (_this.isCheckoutDisabled(theDate)) {
                            return true;
                        }
                    }
                },
                onSelect : function(data) {

                    //Remove all warnings
                    var errordates = _this.element.getElementsByClassName("orbirental-capture-widget-error-dates")[0];
                    errordates.innerHTML = "";

                    var name = elementForm.getAttribute("name");

                    //update checkOut if checkIn change
                    if(name === "checkIn" && _this.checkIn && _this.checkOut) {
                        var date = new Date(_this.checkIn.getDate());
                        date.setDate(date.getDate() + 1);
                        _this.checkOut.setMinDate(date);
                        _this.checkOut.setDate(date);
                    }

                    //update # of nights
                    if(_this.checkOut && _this.checkIn) {
                        /*if(_this.config.nights) {
                            var checkIn = new Date( _this.checkIn.getDate());
                            var checkOut = new Date( _this.checkOut.getDate());
                            var diffDays = checkIn.substractDate(checkOut);
                            var labelNights = document.getElementById("nightsValue");
                            labelNights.innerHTML = diffDays;
                        }*/

                        if(_this.config.price || _this.config.showPriceDetailsLink) {
                            _this.updateDynamicPricingOption();
                        }
                        
                    }

                    if (_this.form.discountCode && _this.form.discountCode.value !== "") {
                        _this.clearCouponErrorsMessage();
                        var checkIn = new Date( _this.checkIn.getDate());
                        var checkOut = new Date( _this.checkOut.getDate());
                        var checkInFormat =  checkIn.yyyymmdd();
                        var checkOutFormat = checkOut.yyyymmdd();
                        var coupon =  _this.form.discountCode.value;
                        widgetHelper.checkDiscountCode(checkInFormat, checkOutFormat, coupon, _this)
                    }
                },
                notAvailableDates : (name === "checkIn") ? _this.getAllUnavailableDatesForCheckin() : _this.getAllUnavailableDatesForCheckout(),
                toString(date, format) {
                    return date.yyyymmdd();
                },
            });

            if(name === "checkIn") {
                _this.checkIn = picker;
            } else if(name === "checkOut") {
                _this.checkOut = picker;
            }

            picker.setMinDate(calcTime(_this.property.timezoneOffset));
        }

        if (field.wrapperClass.indexOf("orbirental-capture-coupon") !== - 1) {

            elementForm.addEventListener('input', function() {
                _this.clearCouponErrorsMessage();

                var checkIn = new Date( _this.checkIn.getDate());
                var checkOut = new Date( _this.checkOut.getDate());
                var checkInFormat =  checkIn.yyyymmdd();
                var checkOutFormat = checkOut.yyyymmdd();

                if (this.value !== "") {
                    widgetHelper.checkDiscountCode(checkInFormat, checkOutFormat, this.value, _this)
                }
            }); // register for oninput
        }
    }

    if(this.isIE()) {
        wrapperForm.appendChild(labelForm);
    }

    wrapperForm.appendChild(elementForm);
    return wrapperForm;
};

Widget.prototype.getAllUnavailableDatesForCheckin = function (reason) {

    var dates = [];

    for (var i = 0; i < this.notAvailableDatesForCheckIn.length; i++) {
        if (typeof reason === "undefined" || (this.notAvailableDatesForCheckIn[i].reason === "booking")) {
            dates.push(this.notAvailableDatesForCheckIn[i].date);
        }
    }

    return dates;
};

Widget.prototype.getAllUnavailableDatesForCheckout = function (reason) {

    var dates = [];

    for (var i = 0; i < this.notAvailableDatesForCheckOut.length; i++) {
        if (typeof reason === "undefined" || (this.notAvailableDatesForCheckOut[i].reason === "booking")) {
            dates.push(this.notAvailableDatesForCheckOut[i].date);
        }
    }

    return dates;
};

/*
    Date: date to test if must be disabled
 */
Widget.prototype.isCheckoutDisabled = function (_date) {
    var date = new Date(_date);
    var checkin = new Date(this.checkIn.getDate());

    //Disable the date if in notAvailableDatesForCheckOut
    if (this.getAllUnavailableDatesForCheckout().indexOf(date.yyyymmdd()) !== -1) {
        return true;
    }

    //Disable the date if inferior to checkin
    if (date.getTime() <= checkin.getTime()) {
        return true;
    }

    //Loop from checkin + 1 to the date
    var startLoop = new Date(checkin.setDate(checkin.getDate()) + 1);

    //if between checkin and date, there is a booking the date is not available
    var isDisabled = false;
    while(startLoop <= date){
        if (this.getAllUnavailableDatesForCheckin("booking").indexOf(startLoop.yyyymmdd()) !== -1) {
            isDisabled = true;
        }
        startLoop = new Date(startLoop.setDate(startLoop.getDate() + 1));
    }

    return isDisabled;
};

Widget.prototype.isCheckinDisabled = function (_date) {
    var date = new Date(_date);

    if (this.property.onlyCheckInOnDay != null) {

        var day = date.getDay();

        if (this.property.onlyCheckInOnDay.indexOf(day + "") === -1) {
            return true;
        }
    }

    return false;
};

Widget.prototype.getTextareaElement = function (name, field) {
    var wrapperForm = document.createElement("div");
    var labelForm; //Add label if IE
    var elementForm = document.createElement("textarea");
    elementForm.name = name;

    if(this.isIE()) {
        labelForm = document.createElement("label");
        labelForm.innerHTML = this.templates.placeholder[name];
    } else {
        elementForm.placeholder = this.templates.placeholder[name];
        if(field.required) elementForm.placeholder = "*" + this.templates.placeholder[name];
    }

    if(field.required) {
        elementForm.required = true;
    }

    wrapperForm.className += " orbirental-capture-widget-wrapper";

    if(field.wrapperClass) {
        wrapperForm.className += " " + field.wrapperClass;
    }

    if(field.value) {
        elementForm.value = field.value;
    } else if(widgetHelper.getCookie(name) != null) {
        elementForm.value = widgetHelper.getCookie(name);
    } else {
        elementForm.value = "";
    }

    if(this.isIE()) {
        wrapperForm.appendChild(labelForm);
    }
    wrapperForm.appendChild(elementForm);
    return wrapperForm;
};

Widget.prototype.getSelectElement = function (name, field) {
    var wrapperForm = document.createElement("div");
    var _this = this;
    var labelForm; //Add label if IE
    var elementForm = document.createElement("select");
    elementForm.name = name;

    elementForm.onchange = function() {
        if(_this.config.price && name === "guests") {
            _this.updateDynamicPricingOption();
        }
    };

    if (name === "guests") {

        for (var i = 1; i <= this.property.maximumGuests; i++) {

            var option = document.createElement("option");
            option.value = i;
            option.text = i + " " + this.templates.label[name];
            elementForm.add(option);
        }
    } else {

        for (var prop in this.templates.label[name]) {

            if(this.templates.label[name].hasOwnProperty(prop)) {
                var option = document.createElement("option");
                option.value = prop;
                option.text = this.templates.label[name][prop];
                elementForm.add(option);
            }
        }
    }


    if(field.value) {
        elementForm.value = field.value;
    } else if(widgetHelper.getCookie(name) != null) {
        elementForm.value = widgetHelper.getCookie(name);
    } else {
        elementForm.value = "";
    }

    wrapperForm.className += " orbirental-capture-widget-wrapper";

    if(field.wrapperClass) {
        wrapperForm.className += " " + field.wrapperClass;
    }

    if(this.isIE()) {
        labelForm = document.createElement("label");
        labelForm.innerHTML = this.templates.placeholder[name];
        wrapperForm.appendChild(labelForm);
    }

    wrapperForm.appendChild(elementForm);
    return wrapperForm;
};

Widget.prototype.showPriceOption = function() {

    var wrapper = document.createElement("div");
    wrapper.className = "orbirental-capture-widget-wrapper orbirental-capture-widget-price-option";

    if (this.config.price) {

        var p = document.createElement("p");
        p.style.color = this.config.labelColor;

        var priceFormat = this.formatPrice(this.property.price, this.property.currencySymbol);
        var label =  this.templates.label.price.replace("%D%",  priceFormat);

        p.innerHTML = label;
        wrapper.appendChild(p);
    }


    this.form.insertBefore(wrapper,this.form.firstChild);
};

Widget.prototype.showNumberOfNights = function() {

    var wrapper = document.createElement("div");
    wrapper.className = "orbirental-capture-widget-wrapper orbirental-capture-widget-totalnights small text-left";

    var p = document.createElement("p");
    p.style.color = this.config.labelColor;
    p.innerHTML = this.templates.label.stay.replace("%D%", "<span class=\"total-nights\"></span>");
    wrapper.appendChild(p);

    this.form.insertBefore(wrapper,this.form.firstChild);
};

Widget.prototype.showMinStayOption = function() {

    var wrapper = document.createElement("div");
    wrapper.className = "orbirental-capture-widget-wrapper orbirental-capture-widget-minstay-option small text-right";

    if (this.config.minStay) {

        var p = document.createElement("p");
        p.style.color = this.config.labelColor;
        p.innerHTML = this.templates.label.stay.replace("%D%", "<span class=\"minimum-stay-span\">" + this.property.minStay + "</span>");
        wrapper.appendChild(p);
    }


    this.form.insertBefore(wrapper,this.form.firstChild);
};

Widget.prototype.clearErrorsMessage = function() {

    var errordates = this.element.getElementsByClassName("orbirental-capture-widget-error-dates")[0];
    if(errordates != null) {
        errordates.innerHTML = "";
    }

    var errorguests = this.element.getElementsByClassName("orbirental-capture-widget-error-guests")[0];
    if(errorguests != null) {
        errorguests.innerHTML = "";
    }
};

Widget.prototype.clearCouponErrorsMessage = function() {
    var errorcoupon = this.element.getElementsByClassName("orbirental-capture-widget-error-coupon")[0];
    if(errorcoupon != null) {
        errorcoupon.innerHTML = "";
    }
};

Widget.prototype.includeErrorsMessage = function() {
    var _this = this;
    var label;

    //Add error dates
    var getLabelErrorDates = function() {
        var wrapper = document.createElement("div");
        wrapper.className = "orbirental-capture-widget-wrapper";

        var p = document.createElement("p");
        p.className = "orbirental-capture-widget-error-dates";

        wrapper.appendChild(p);
        return wrapper;
    };


    label = getLabelErrorDates();
    var checkoutField = this.element.getElementsByClassName("orbirental-capture-checkout")[0];
    checkoutField.parentNode.insertBefore(label, checkoutField.nextSibling);

    //Add error guest
    var getLabelErrorGuest = function() {
        var wrapper = document.createElement("div");
        wrapper.className = "small orbirental-capture-widget-wrapper";

        var p = document.createElement("p");
        p.className = "orbirental-capture-widget-error-guests";

        wrapper.appendChild(p);
        return wrapper;
    };

    label = getLabelErrorGuest();
    var guestsField = this.element.getElementsByClassName("orbirental-capture-guests")[0];
    guestsField.parentNode.insertBefore(label, guestsField.nextSibling);

    //Add error coupon
    var getLabelErrorCoupon = function() {
        var wrapper = document.createElement("div");
        wrapper.className = "small orbirental-capture-widget-wrapper";

        var p = document.createElement("p");
        p.className = "orbirental-capture-widget-error-coupon";

        wrapper.appendChild(p);
        return wrapper;
    };

    label = getLabelErrorCoupon();
    if (this.element.getElementsByClassName("orbirental-capture-coupon").length > 0) {
        var couponField =this.element.getElementsByClassName("orbirental-capture-coupon")[0];
        couponField.parentNode.insertBefore(label, couponField.nextSibling);
    }
};

Widget.prototype.showCCOption = function(value) {
    var submit = this.form.getElementsByTagName("button")[0];

    this.config.cc = value;
    var fieldName = "cc";
    var field = {
        element: "input",
        wrapperClass: "orbirental-capture-widget-wrapper hidden",
        type: "hidden",
        value: value
    };

    var wrapperField = this.getInputElement(fieldName, field);
    this.form.insertBefore(wrapperField, submit);
};

Widget.prototype.showEmailClientOption = function(value) {
    var submit = this.form.getElementsByTagName("button")[0];

    this.config.emailClient = value;
    var fieldName = "emailClient";
    var field = {
        element: "input",
        wrapperClass: "orbirental-capture-widget-wrapper hidden",
        type: "hidden",
        value: value
    };

    var wrapperField = this.getInputElement(fieldName, field);
    this.form.insertBefore(wrapperField, submit);
};

Widget.prototype.updateDynamicPricingOption = function() {
    var checkIn = new Date( this.checkIn.getDate());
    var checkOut = new Date( this.checkOut.getDate());
    var checkInFormat =  checkIn.yyyymmdd();
    var checkOutFormat = checkOut.yyyymmdd();
    var coupon = this.form.discountCode ? this.form.discountCode.value : null;

    widgetHelper.getQuote(this, this.form.guests.value, checkInFormat, checkOutFormat, coupon);
};

Widget.prototype.formatPrice = function(value, currency) {

    var money = parseFloat(value);

    switch (currency) {
        case "$":
            money = money.toMoney(2, '.', ',');  // "12,345,678.90"
            money = currency  + money;
            break;
        case "ГўвЂљВ¬":
            money = money.toMoney(2, ',', ' ');  // "12 345 678,90"
            money = money + currency;
            break;
        default:
            money = money.toMoney(2, '.', ',');  // "12,345,678.90"
            money = currency + money;
            break;
    }

    return money;
};

Widget.prototype.destroy = function () {
    var elem = document.getElementById("leadWidget");

    if (elem == null) return;

    while (elem.hasChildNodes()) {
        elem.removeChild(elem.lastChild);
    }
};

Widget.prototype.getConfig = function () {
    return this.config;
};

WidgetHelper.prototype.loadCSS = function(href) {
    var ss = document.createElement("link");
    ss.type = "text/css";
    ss.rel = "stylesheet";
    ss.href = href;
    document.getElementsByTagName("head")[0].appendChild(ss);
};

WidgetHelper.prototype.getQuote = function (widget, guests, checkIn, checkOut, discountCode) {

    var script = document.createElement('script');
    script.src = this.pathRoot + "api/lead_getquotewidget_api.jsp?jsoncallback=jsonpCallbackQuote&propertyUID=" + widget.propertyUID + "&guests=" + guests + "&checkIn=" + checkIn + "&checkOut=" + checkOut + "&element=" + widget.index + "&discountCode=" + discountCode;
    document.getElementsByTagName('head')[0].appendChild(script);
};

WidgetHelper.prototype.checkDiscountCode = function(checkIn, checkOut, discountCode, widget) {
    var script = document.createElement('script');
    script.src = this.pathRoot + "api/discount_check.jsp?jsoncallback=jsonpCallbackDiscountCode&propertyUID=" + widget.propertyUID + "&element=" + widget.index + "&discountCode=" + discountCode + "&checkIn=" + checkIn + "&checkOut=" + checkOut;
    document.getElementsByTagName('head')[0].appendChild(script);
};

WidgetHelper.prototype.getProperty = function(widget) {
    var script = document.createElement('script');
    script.src = this.pathRoot + "getproperty_api.jsp?jsoncallback=jsonpCallbackProperty&propertyUID=" + widget.propertyUID + "&element=" + widget.index;
    document.getElementsByTagName('head')[0].appendChild(script);
};

WidgetHelper.prototype.getNotAvailableDates = function(widget) {
    var script = document.createElement('script');
    script.src = this.pathRoot + "api/notavailabledates_get_api.jsp?jsoncallback=jsonpCallbackGetNotAvailableDates&propertyUID=" + widget.propertyUID + "&handleCheckInCheckOut=true&element=" + widget.index;
    document.getElementsByTagName('head')[0].appendChild(script);
};

Number.prototype.toMoney = function(c, d, t){

    var n = this,
        c = isNaN(c = Math.abs(c)) ? 2 : c,
        d = d == undefined ? "." : d,
        t = t == undefined ? "," : t,
        s = n < 0 ? "-" : "",
        i = String(parseInt(n = Math.abs(Number(n) || 0).toFixed(c))),
        j = (j = i.length) > 3 ? j % 3 : 0;

    if (this.isInt(n)) {
        c = 0;
    }

    return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
};

Number.prototype.isInt = function(n) {
    return n % 1 === 0;
};

Date.prototype.substractDate = function(date) {
    var negative = false;

    this.setHours(0,0,0,0);
    date.setHours(0,0,0,0);

    if(date.getTime() < this.getTime() ) {
        negative = true;
    }


    var diff = Math.abs(this - date);
    var days = diff / (1000 * 60 * 60 * 24);
    days = Math.ceil(days);

    if(negative) days = days * -1;
    return days;
};

Date.prototype.yyyymmdd = function () {
    var yyyy = this.getFullYear().toString();
    var mm = (this.getMonth() + 1).toString(); // getMonth() is zero-based
    var dd = this.getDate().toString();
    return yyyy + '-' + (mm[1] ? mm : "0" + mm[0]) + '-' + (dd[1] ? dd : "0" + dd[0]); // padding
};

var widgetHelper = null;
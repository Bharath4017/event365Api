let knexConfig = require("../../db/knex");
const knex = require("knex")(knexConfig["development"]);

const randomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const randomElem = (arr) => {
  return arr[randomInt(0, arr.length - 1)];
}

const randomSubstring = async (existingValue,length, type, quantity) => {
  let substr = '';
  let string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let randomNumberArr =  [];
  for(j = 0; j < parseInt(quantity); j++){
    substr = '';
    for (i = 0; i < length; i++) {
      substr += randomElem(string);
    }
      //Random integer
      
      let len = (type=='ticket') ? 5 : 4;
      let intValue = await randomInteger(type, len)
      strInt = substr+intValue.toUpperCase();
     
      //console.log(substr.toUpperCase());
      //check if already exists on other ticket
      if(existingValue.length>0 && existingValue.includes(strInt)){ //check if value already exists
        return await randomSubstring(existingValue, length, type, quantity);
      }
      //check if already exists on database
      if(type=='ticket') {
        randomNumberArr.push(strInt);
      }else if(type == 'invoice'){
        randomNumberArr.push(strInt);
      }
    }
    if(type=='ticket'){
      let [err, checkDuplicateTicket] = await to(knex('ticketNumber').select('id')
      .whereIn("ticketNumber", [randomNumberArr]));
      if(checkDuplicateTicket!= undefined && checkDuplicateTicket.length > 0){
        return await randomSubstring(existingValue, length, type, quantity);
      }
    }else if(type=='invoice'){
      let [err, checkDuplicateinvoice] = await to(knex('events').select('id')
      .whereIn("invoiceNo", [randomNumberArr]));
      if(checkDuplicateinvoice!= undefined && checkDuplicateinvoice.length > 0){
        return await randomSubstring(existingValue, length, type, quantity);
      }
    }
    if(type=='coupan'){
      strInt = substr.toUpperCase();
      return strInt;
    } else {
      return randomNumberArr;
    }
 
}

let randomInteger = async (type, length) => {
  var result           = '';
  var characters       = '123456789123456789'+ new Date().getTime();
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
     result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  console.log(charactersLength, characters,'type');
  if(type=='event') {
    let isExists = await knex('events').select('id').where('eventCode', result);
    console.log(isExists,'isExists');
    if(isExists!= undefined && isExists.length > 0){
      return await randomInteger(type, length);
    }
  }
  return result;
}

module.exports = {
  randomInt,
  randomElem,
  randomSubstring,
  randomInteger
}

const { GoogleGenerativeAI } = require("@google/generative-ai");


// =============================
// Gemini Setup
// =============================

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY
);


const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash"
});




// =============================
// Gemini Extraction
// =============================

async function extractWithGemini(records) {

  const prompt = `

You are a CRM data extraction AI.

Convert CSV rows into GrowEasy CRM format.

Return ONLY JSON array.


Fields:

created_at
name
email
country_code
mobile_without_country_code
company
city
state
country
lead_owner
crm_status
crm_note
data_source
possession_time
description


Allowed crm_status:

GOOD_LEAD_FOLLOW_UP
DID_NOT_CONNECT
BAD_LEAD
SALE_DONE


Rules:

- Extract intelligently even if column names are different.
- If email/mobile missing skip record.
- Multiple emails or phones go into crm_note.


CSV:

${JSON.stringify(records)}

`;



  const result = await model.generateContent(prompt);


  const text = result.response.text();


  const cleaned = text
    .replace(/```json/g,"")
    .replace(/```/g,"")
    .trim();


  return JSON.parse(cleaned);

}






// =============================
// Status Detection
// =============================

function detectStatus(text){


  text=text.toLowerCase();



  if(
    text.includes("not interested") ||
    text.includes("rejected")
  ){

    return "BAD_LEAD";

  }



  if(
    text.includes("sold") ||
    text.includes("deal closed") ||
    text.includes("completed")
  ){

    return "SALE_DONE";

  }



  if(
    text.includes("no answer") ||
    text.includes("not connected") ||
    text.includes("busy")
  ){

    return "DID_NOT_CONNECT";

  }



  return "GOOD_LEAD_FOLLOW_UP";

}







// =============================
// Helper Detection Functions
// =============================


function isEmail(value){

 return String(value).includes("@");

}



function cleanPhone(value){

 return String(value).replace(/\D/g,"");

}








// =============================
// Fallback Mapper
// =============================


function fallbackMapping(records){


return records

.filter(row=>{


const values=Object.values(row);


return values.some(v=>
 isEmail(v) ||
 cleanPhone(v).length>=7
);


})



.map(row=>{


const crm={


created_at:"",
name:"",
email:"",
country_code:"",
mobile_without_country_code:"",
company:"",
city:"",
state:"",
country:"",
lead_owner:"",
crm_status:"",
crm_note:"",
data_source:"",
possession_time:"",
description:""


};



let fullText="";



Object.entries(row).forEach(([key,value])=>{


const k=key.toLowerCase().trim();


fullText += " "+value;





// EMAIL FIRST

if(
 k.includes("email") ||
 k.includes("mail") ||
 k.includes("contact")
){

 if(isEmail(value)){

  crm.email=value;

 }

}





// NAME

else if(

 k==="name" ||
 k.includes("customer_name") ||
 k.includes("lead_name") ||
 k.includes("full_name")

){

 crm.name=value;

}







// PHONE

else if(

 k.includes("phone") ||
 k.includes("mobile") ||
 k.includes("whatsapp") ||
 k.includes("contact_number")

){


const phone=cleanPhone(value);


if(phone.length>=10){

crm.country_code="+91";
crm.country="India";
crm.mobile_without_country_code=phone;

}


}







// COMPANY

else if(

 k.includes("company") ||
 k.includes("business") ||
 k.includes("firm") ||
 k.includes("organization")

){

crm.company=value;

}







// CITY

else if(

 k.includes("city") ||
 k.includes("location") ||
 k.includes("address")

){

crm.city=value;

}







// DESCRIPTION

else if(

 k.includes("job") ||
 k.includes("role") ||
 k.includes("title") ||
 k.includes("position")

){

crm.description=value;

}






// NOTES

else if(

 k.includes("remark") ||
 k.includes("note") ||
 k.includes("comment")

){

crm.crm_note=value;

}






else{


crm.crm_note += `${key}: ${value}; `;


}



});






crm.crm_status = detectStatus(fullText);



return crm;



});


}







// =============================
// Main Export
// =============================


async function extractCRMData(records){


try{


console.log("Trying Gemini AI...");


return await extractWithGemini(records);


}


catch(error){


console.log(
"Gemini unavailable. Using fallback mapper."
);


return fallbackMapping(records);


}


}




module.exports={
extractCRMData
};
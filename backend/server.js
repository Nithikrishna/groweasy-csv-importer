require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const csv = require("csv-parser");
const { Readable } = require("stream");

const { extractCRMData } = require("./services/aiService");


const app = express();


app.use(cors());
app.use(express.json());


// Store uploaded CSV in memory
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage
});



// Test route
app.get("/", (req, res) => {

  res.send("Backend is running!");

});




// =================================
// 1. CSV UPLOAD + PREVIEW
// =================================

app.post("/upload", upload.single("file"), (req, res) => {


  if (!req.file) {

    return res.status(400).json({

      success:false,
      message:"No file uploaded"

    });

  }


  const records = [];



  Readable.from(req.file.buffer)

    .pipe(csv())


    .on("data", (row)=>{

      records.push(row);

    })


    .on("end", ()=>{


      console.log("CSV Preview:");

      console.log(records);



      res.json({

        success:true,

        message:"CSV parsed successfully",

        records:records

      });


    })


    .on("error",(error)=>{


      console.log(error);


      res.status(500).json({

        success:false,

        message:"CSV parsing failed"

      });


    });


});







// =================================
// 2. AI EXTRACTION
// =================================


app.post("/extract", async(req,res)=>{


  try{


    const records = req.body.records;



    if(!records || records.length===0){


      return res.status(400).json({

        success:false,

        message:"No records received"

      });


    }



    console.log("Sending records to Gemini...");



    const aiResult = await extractCRMData(records);



    console.log("AI Result:");

    console.log(aiResult);




    res.json({

      success:true,

      message:"AI extraction completed",

      imported:aiResult.length,

      skipped:records.length - aiResult.length,

      data:aiResult

    });



  }


  catch(error){


    console.log("AI Error:");

    console.log(error);



    res.status(500).json({

      success:false,

      message:"AI extraction failed"

    });


  }


});







// Server

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});



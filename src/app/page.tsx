"use client";

import { useState } from "react";

export default function Home() {

  const [file, setFile] = useState<File | null>(null);

  const [previewData, setPreviewData] = useState<any[]>([]);

  const [resultData, setResultData] = useState<any[]>([]);
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState<{
    imported: number;
    skipped: number;
  } | null>(null);



  const handleUpload = async () => {


    if (!file) {

      setMessage("Please select a CSV file first");

      return;

    }


    const formData = new FormData();

    formData.append("file", file);



    try {


      setLoading(true);

      setMessage("Uploading CSV...");



      const response = await fetch(
        "https://groweasy-backend-wpmu.onrender.com/upload",
        {
          method:"POST",
          body:formData
        }
      );



      const data = await response.json();



      if(data.success){


        setPreviewData(data.records);

        setMessage(
          "CSV uploaded successfully. Review and confirm import."
        );


      }


    }

    catch(error){

      console.log(error);

      setMessage("Upload failed");

    }


    finally{

      setLoading(false);

    }

  };







  const handleConfirm = async()=>{


    try{


      setLoading(true);

      setMessage("AI is processing your CSV...");



      const response = await fetch(

        "https://groweasy-backend-wpmu.onrender.com/extract",
        {

          method:"POST",

          headers:{
            "Content-Type":"application/json"
          },

          body:JSON.stringify({

            records:previewData

          })

        }

      );



      const data = await response.json();



      if(data.success){


        setResultData(data.data);



        setStats({

          imported:data.imported,

          skipped:data.skipped

        });



        setMessage(
          "Import completed successfully!"
        );


      }



    }


    catch(error){

      console.log(error);

      setMessage("AI processing failed");

    }


    finally{

      setLoading(false);

    }


  };







  const renderTable = (data: any[]) => {


    if(!data.length) return null;


    return (

      <div className="table-container">


        <table>


          <thead>

            <tr>

              {
                Object.values(row as Record<string, unknown>).map((value, i) => (

                  <td key={i}>
                    {String(value ?? "")}
                  </td>

                ))
              }

            </tr>

          </thead>



          <tbody>


            {

              data.map((row,index)=>(


                <tr key={index}>


                  {

                    Object.values(row).map((value,i)=>(

                      <td key={i}>
                        {value}
                      </td>

                    ))

                  }


                </tr>


              ))

            }


          </tbody>


        </table>


      </div>

    );


  };







  return (

    <main className="container">


      <h1>
        🤖 AI CSV Importer
      </h1>



      <p className="subtitle">
        Upload CSV files and automatically convert them into GrowEasy CRM format.
      </p>




      <section className="card">


        <h2>
          Step 1: Upload CSV
        </h2>


        <input

          type="file"

          accept=".csv"

          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              setFile(e.target.files[0]);
            }
          }}

        />


        {
          file &&

          <p>
            Selected file: {file.name}
          </p>

        }



        <button onClick={handleUpload}>

          Upload CSV

        </button>



      </section>







      {
        previewData.length>0 &&


        <section className="card">


          <h2>
            Step 2: CSV Preview
          </h2>


          {renderTable(previewData)}



          <button onClick={handleConfirm}>

            Confirm Import

          </button>


        </section>

      }







      {
        loading &&

        <div className="loading">

          Processing...

        </div>

      }






      {
        resultData.length>0 &&


        <section className="card">


          <h2>
            Step 3: CRM Result
          </h2>


          {renderTable(resultData)}



          {

            stats &&

            <div className="stats">

              <h3>
                Import Summary
              </h3>


              <p>
                ✅ Imported: {stats.imported}
              </p>


              <p>
                ⚠️ Skipped: {stats.skipped}
              </p>


            </div>

          }



        </section>

      }






      <h3 className="message">

        {message}

      </h3>




    </main>

  );

}
"use client";

import { useState } from "react";

export default function Home() {

  const [file, setFile] = useState<File | null>(null);

  const [previewData, setPreviewData] = useState<Record<string, unknown>[]>([]);

  const [resultData, setResultData] = useState<Record<string, unknown>[]>([]);

  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState<{
    imported: number;
    skipped: number;
  } | null>(null);



  // ==========================
  // Upload CSV
  // ==========================

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
          method: "POST",
          body: formData
        }

      );

      const data = await response.json();

      if (data.success) {

        setPreviewData(data.records);

        setMessage(

          "CSV uploaded successfully. Review and confirm import."

        );

      } else {

        setMessage(data.message);

      }

    }

    catch (error) {

      console.log(error);

      setMessage("Upload failed");

    }

    finally {

      setLoading(false);

    }

  };



  // ==========================
  // AI Extraction
  // ==========================

  const handleConfirm = async () => {

    try {

      setLoading(true);

      setMessage("AI is processing your CSV...");

      const response = await fetch(

        "https://groweasy-backend-wpmu.onrender.com/extract",

        {

          method: "POST",

          headers: {

            "Content-Type": "application/json"

          },

          body: JSON.stringify({

            records: previewData

          })

        }

      );

      const data = await response.json();

      if (data.success) {

        setResultData(data.data);

        setStats({

          imported: data.imported,

          skipped: data.skipped

        });

        setMessage("Import completed successfully!");

      }

      else {

        setMessage(data.message);

      }

    }

    catch (error) {

      console.log(error);

      setMessage("AI processing failed");

    }

    finally {

      setLoading(false);

    }

  };
    // ==========================
  // Download Result CSV
  // ==========================

  const downloadCSV = () => {

    if (!resultData.length) return;

    const headers = Object.keys(resultData[0]);

    const rows = resultData.map((row) =>

      headers
        .map((header) => `"${String(row[header] ?? "")}"`)
        .join(",")

    );

    const csvContent = [

      headers.join(","),

      ...rows

    ].join("\n");

    const blob = new Blob(

      [csvContent],

      {

        type: "text/csv;charset=utf-8;"

      }

    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = "crm_results.csv";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);

  };



  // ==========================
  // Render Table
  // ==========================

  const renderTable = (data: Record<string, unknown>[]) => {

    if (!data.length) return null;

    return (

      <div className="table-container">

        <table>

          <thead>

            <tr>

              {

                Object.keys(data[0]).map((key) => (

                  <th key={key}>

                    {key}

                  </th>

                ))

              }

            </tr>

          </thead>

          <tbody>

            {

              data.map((row, index) => (

                <tr key={index}>

                  {

                    Object.values(row).map((value, i) => (

                      <td key={i}>

                        {String(value ?? "")}

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

          file && (

            <p>

              Selected file: <strong>{file.name}</strong>

            </p>

          )

        }

        <button onClick={handleUpload}>

          Upload CSV

        </button>

      </section>



      {

        previewData.length > 0 && (

          <section className="card">

            <h2>
              Step 2: CSV Preview
            </h2>

            {renderTable(previewData)}

            <button onClick={handleConfirm}>

              Confirm Import

            </button>

          </section>

        )

      }



      {

        loading && (

          <div className="loading">

            Processing...

          </div>

        )

      }



      {

        resultData.length > 0 && (

          <section className="card">

            <h2>
              Step 3: CRM Result
            </h2>

            {renderTable(resultData)}

            {

              stats && (

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

              )

            }

            <button onClick={downloadCSV}>

              📥 Download CRM CSV

            </button>

          </section>

        )

      }



      <h3 className="message">

        {message}

      </h3>

    </main>

  );

}
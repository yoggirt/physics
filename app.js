import * as pdfjsLib
    from "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.54/pdf.min.mjs";

import { sha256 } from "./hash.js";
import { put, get, getAll } from "./database.js";
import { PDFViewer } from "./pdfViewer.js";

const pdfInput =
    document.getElementById("pdfInput");

const documentInfo =
    document.getElementById("documentInfo");

const documentList =
    document.getElementById("documentList");

const pages =
    document.getElementById("pages");

const emptyState =
    document.getElementById("emptyState");

const viewer =
    new PDFViewer(pages);

let currentFile = null;

async function openPDF(file) {
    currentFile = file;

    documentInfo.textContent = "Calculating file hash...";

    const hash = await sha256(file);

    documentInfo.textContent =
        `${file.name} — ${hash.slice(0, 12)}...`;

    const existing = await get("documents", hash);

    if (!existing) {
        await put("documents", {
            hash,
            filename: file.name,
            size: file.size,
            created: Date.now()
        });
    }

    const buffer = await file.arrayBuffer();

    const pdf =
        await pdfjsLib.getDocument({
            data: buffer
        }).promise;

    emptyState.style.display = "none";

    await viewer.load(pdf, hash);

    await refreshDocuments();
}

async function refreshDocuments() {
    const documents = await getAll("documents");

    documentList.innerHTML = "";

    for (const document of documents) {
        const button =
            document.createElement("button");

        button.className = "document-button";
        button.textContent = document.filename;

        button.title = document.hash;

        button.addEventListener("click", async () => {
            if (!currentFile) return;

            // Only reload if the selected document is the
            // currently uploaded file.
            const hash = await sha256(currentFile);

            if (hash !== document.hash) {
                alert(
                    "Please upload this PDF again to open it."
                );
                return;
            }

            openPDF(currentFile);
        });

        documentList.appendChild(button);
    }
}

pdfInput.addEventListener("change", async () => {
    const file = pdfInput.files[0];

    if (!file) return;

    try {
        await openPDF(file);
    } catch (error) {
        console.error(error);
        alert("Could not open the PDF.");
    }
});

refreshDocuments();

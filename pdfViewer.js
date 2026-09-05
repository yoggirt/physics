import {
    createHighlight,
    loadAnnotations,
    drawAnnotation
} from "./annotations.js";

export class PDFViewer {
    constructor(container) {
        this.container = container;
        this.pdf = null;
        this.documentHash = null;
        this.scale = 1.4;
    }

    async load(pdf, documentHash) {
        this.pdf = pdf;
        this.documentHash = documentHash;

        this.container.innerHTML = "";

        const annotations =
            await loadAnnotations(documentHash);

        for (let pageNumber = 1;
             pageNumber <= pdf.numPages;
             pageNumber++) {

            await this.renderPage(
                pageNumber,
                annotations.filter(a => a.page === pageNumber)
            );
        }
    }

    async renderPage(pageNumber, annotations) {
        const page = await this.pdf.getPage(pageNumber);

        const viewport =
            page.getViewport({ scale: this.scale });

        const pageContainer =
            document.createElement("div");

        pageContainer.className = "pdf-page";
        pageContainer.dataset.page = pageNumber;

        const canvas =
            document.createElement("canvas");

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const context = canvas.getContext("2d");

        await page.render({
            canvasContext: context,
            viewport
        }).promise;

        const annotationLayer =
            document.createElement("div");

        annotationLayer.className = "annotation-layer";

        for (const annotation of annotations) {
            drawAnnotation(annotation, annotationLayer);
        }

        pageContainer.appendChild(canvas);
        pageContainer.appendChild(annotationLayer);

        this.addInteraction(
            pageContainer,
            annotationLayer,
            pageNumber
        );

        this.container.appendChild(pageContainer);
    }

    addInteraction(pageContainer, layer, pageNumber) {
        let start = null;
        let preview = null;

        pageContainer.addEventListener("pointerdown", event => {
            if (event.button !== 0) return;

            const rect =
                pageContainer.getBoundingClientRect();

            start = {
                x: (event.clientX - rect.left) / rect.width,
                y: (event.clientY - rect.top) / rect.height
            };

            preview = document.createElement("div");
            preview.className = "annotation highlight preview";
            layer.appendChild(preview);
        });

        pageContainer.addEventListener("pointermove", event => {
            if (!start || !preview) return;

            const rect =
                pageContainer.getBoundingClientRect();

            const current = {
                x: (event.clientX - rect.left) / rect.width,
                y: (event.clientY - rect.top) / rect.height
            };

            const x = Math.min(start.x, current.x);
            const y = Math.min(start.y, current.y);

            const width =
                Math.abs(current.x - start.x);

            const height =
                Math.abs(current.y - start.y);

            preview.style.left = `${x * 100}%`;
            preview.style.top = `${y * 100}%`;
            preview.style.width = `${width * 100}%`;
            preview.style.height = `${height * 100}%`;
        });

        pageContainer.addEventListener("pointerup", async event => {
            if (!start || !preview) return;

            const rect =
                pageContainer.getBoundingClientRect();

            const current = {
                x: (event.clientX - rect.left) / rect.width,
                y: (event.clientY - rect.top) / rect.height
            };

            const annotation = await createHighlight({
                document: this.documentHash,
                page: pageNumber,

                x: Math.min(start.x, current.x),
                y: Math.min(start.y, current.y),

                width: Math.abs(current.x - start.x),
                height: Math.abs(current.y - start.y)
            });

            preview.remove();

            drawAnnotation(annotation, layer);

            start = null;
            preview = null;
        });
    }
}

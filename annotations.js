import { put, getAnnotationsForDocument } from "./database.js";

function makeID() {
    return crypto.randomUUID();
}

export async function createHighlight({
    document,
    page,
    x,
    y,
    width,
    height,
    colour = "#ffff00"
}) {
    const annotation = {
        id: makeID(),
        document,
        page,

        type: "highlight",

        rect: {
            x,
            y,
            width,
            height
        },

        data: {
            colour,
            opacity: 0.35
        },

        created: Date.now()
    };

    await put("annotations", annotation);
    return annotation;
}

export async function loadAnnotations(documentHash) {
    return getAnnotationsForDocument(documentHash);
}

export function drawAnnotation(annotation, layer) {
    const rect = document.createElement("div");

    rect.className = "annotation highlight";

    rect.style.left = `${annotation.rect.x * 100}%`;
    rect.style.top = `${annotation.rect.y * 100}%`;
    rect.style.width = `${annotation.rect.width * 100}%`;
    rect.style.height = `${annotation.rect.height * 100}%`;

    rect.style.background =
        annotation.data?.colour ?? "#ffff00";

    rect.style.opacity =
        annotation.data?.opacity ?? 0.35;

    rect.dataset.annotationId = annotation.id;

    layer.appendChild(rect);
}

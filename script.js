const inputText = document.getElementById("inputText");
const sampleBox = document.getElementById("sampleBox");
const imageInput = document.getElementById("imageInput");
const previewImage = document.getElementById("previewImage");
const imagePlaceholder = document.getElementById("imagePlaceholder");
const analyzeBtn = document.getElementById("analyzeBtn");
const resetBtn = document.getElementById("resetBtn");
const resultBox = document.getElementById("resultBox");
const loadingText = document.getElementById("loadingText");

let selectedImage = null;

sampleBox.addEventListener("change", () => {
    const selected = sampleBox.value;

    if (selected !== "") {
        inputText.value = selected;

        if (selected.startsWith("http")) {
            document.querySelector('input[value="Link"]').checked = true;
        } else {
            document.querySelector('input[value="Text"]').checked = true;
        }
    }
});

imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];

    if (file) {
        selectedImage = file;
        previewImage.src = URL.createObjectURL(file);
        previewImage.style.display = "block";
        imagePlaceholder.style.display = "none";
        document.querySelector('input[value="Image"]').checked = true;
    }
});

analyzeBtn.addEventListener("click", async () => {
    const mode = document.querySelector('input[name="mode"]:checked').value;

    if (mode === "Text") {
        const text = inputText.value.trim();

        if (text === "") {
            alert("Please enter text.");
            return;
        }

        resultBox.textContent = analyze(text, "Text");
    }

    else if (mode === "Link") {
        const link = inputText.value.trim();

        if (link === "") {
            alert("Please enter a URL.");
            return;
        }

        resultBox.textContent = analyze(link, "Link");
    }

    else if (mode === "Image") {
        if (!selectedImage) {
            alert("Please upload an image first.");
            return;
        }

        loadingText.textContent = "Reading text from image, please wait...";
        resultBox.textContent = "";

        try {
            const result = await Tesseract.recognize(selectedImage, "eng");
            const extractedText = result.data.text.trim();

            loadingText.textContent = "";

            if (extractedText === "") {
                resultBox.textContent = "No readable text was found in the image.";
                return;
            }

            resultBox.textContent =
                "Extracted Text From Image:\n" +
                extractedText +
                "\n\n" +
                analyze(extractedText, "Image");

        } catch (error) {
            loadingText.textContent = "";
            resultBox.textContent = "Error: System could not read text from image.";
        }
    }
});

resetBtn.addEventListener("click", () => {
    inputText.value = "";
    sampleBox.value = "";
    imageInput.value = "";
    selectedImage = null;

    previewImage.src = "";
    previewImage.style.display = "none";
    imagePlaceholder.style.display = "block";

    resultBox.textContent = "Analysis results will appear here...";
    loadingText.textContent = "";

    document.querySelector('input[value="Text"]').checked = true;
});

function analyze(text, mode) {
    text = text.toLowerCase().trim();

    let score = 0;
    let patterns = "";
    let explanation = "";
    let recommendation = "";

    if (mode === "Link") {
        if (
            text.includes("http://") ||
            text.includes(".exe") ||
            text.includes("bit.ly") ||
            text.includes(".zip") ||
            text.includes("verify-account")
        ) {
            score += 50;
            patterns += "• Malicious Link Pattern\n";
            explanation += "• Insecure protocol or suspicious URL shortener detected.\n";
            recommendation += "• Dangerous! Do not open this link in your browser.\n";
        } else {
            return "Analysis Result: This link appears to be safe.";
        }
    }

    else if (mode === "Text" || mode === "Image") {
        const fraudKeywords = [
            "login required",
            "bank details",
            "identity theft",
            "winner",
            "prize",
            "password expired",
            "unauthorized access"
        ];

        for (let word of fraudKeywords) {
            if (text.includes(word)) {
                score += 45;
                patterns += "• Phishing/Scam Keywords\n";
                explanation += "• Detected text commonly used to steal personal information.\n";
                recommendation += "• Do not share any sensitive data based on this message.\n";
                break;
            }
        }

        if (text.includes("accept all") || text.includes("agree to all")) {
            score += 30;
            patterns += "• Hidden Consent\n";
            explanation += "• Forced data tracking agreement.\n";
            recommendation += "• Try to find 'Reject All' options.\n";
        }

        if (text.includes("hurry") || text.includes("limited time")) {
            score += 20;
            patterns += "• Urgency Pressure\n";
            explanation += "• Psychological pressure to force a fast decision.\n";
            recommendation += "• Take your time to verify the source.\n";
        }

        if (score === 0) {
            return "Analysis Result: No suspicious patterns detected.";
        }
    }

    let level;

    if (score >= 60) {
        level = "CRITICAL";
    } else if (score >= 30) {
        level = "SUSPICIOUS";
    } else {
        level = "LOW RISK";
    }

    return "--- [" + mode.toUpperCase() + " ANALYSIS REPORT] ---\n" +
        "Risk Level: " + level + " | Score: " + score + "\n\n" +
        "Detected Patterns:\n" + patterns + "\n" +
        "Explanation:\n" + explanation + "\n" +
        "Recommendations:\n" + recommendation;
}
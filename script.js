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

        loadingText.textContent = "Reading text from image...";
        resultBox.textContent = "";

        try {
            const result = await Tesseract.recognize(selectedImage, "eng");
            const extractedText = result.data.text.trim();

            loadingText.textContent = "";

            if (extractedText === "") {
                resultBox.textContent = "No readable text found.";
                return;
            }

            resultBox.textContent =
                "Extracted Text:\n" + extractedText + "\n\n" +
                analyze(extractedText, "Image");

        } catch (error) {
            loadingText.textContent = "";
            resultBox.textContent = "Error reading image.";
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
            explanation += "• Suspicious or insecure link detected.\n";
            recommendation += "• Do not open this link.\n";
        } else {
            return "Analysis Result: This link appears to be safe.";
        }
    }

    else {
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
                patterns += "• Phishing/Scam\n";
                explanation += "• Possible attempt to steal information.\n";
                recommendation += "• Do not share sensitive data.\n";
                break;
            }
        }

        if (text.includes("accept all") || text.includes("agree to all")) {
            score += 30;
            patterns += "• Hidden Consent\n";
            explanation += "• Forced agreement detected.\n";
            recommendation += "• Look for reject options.\n";
        }

        if (text.includes("hurry") || text.includes("limited time") || text.includes("only today")) {
            score += 20;
            patterns += "• Urgency Pressure\n";
            explanation += "• Pressure to act quickly.\n";
            recommendation += "• Take your time before deciding.\n";
        }

        // 🔥 Misdirection (BIG / SMALL buttons)
        if (
            text.includes("big accept") ||
            text.includes("small reject") ||
            text.includes("large accept") ||
            text.includes("tiny reject") ||
            text.includes("accept button") ||
            text.includes("reject button")
        ) {
            score += 25;
            patterns += "• Misdirection\n";
            explanation += "• Accept option is more visible than reject.\n";
            recommendation += "• Make both options equal.\n";
        }

        if (score === 0) {
            return "Analysis Result: No suspicious patterns detected.";
        }
    }

    let level;
    if (score >= 60) level = "CRITICAL";
    else if (score >= 30) level = "SUSPICIOUS";
    else level = "LOW RISK";

    return "--- [" + mode.toUpperCase() + " ANALYSIS REPORT] ---\n" +
        "Risk Level: " + level + " | Score: " + score + "\n\n" +
        "Detected Patterns:\n" + patterns + "\n" +
        "Explanation:\n" + explanation + "\n" +
        "Recommendations:\n" + recommendation;
}

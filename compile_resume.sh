#!/bin/zsh

# Set variables
RESUME_FILE="resume.tex"
OUTPUT_NAME="LivinMathewResume"
OUTPUT_DIR="."

echo "Starting LaTeX compilation..."

# Clean up any previous compilation files
rm -f "${OUTPUT_NAME}.pdf" "${OUTPUT_NAME}.aux" "${OUTPUT_NAME}.log" "${OUTPUT_NAME}.out"

# Compile directly with pdflatex
echo "� Compiling ${RESUME_FILE}..."
pdflatex -interaction=nonstopmode -output-directory="${OUTPUT_DIR}" -jobname="${OUTPUT_NAME}" "${RESUME_FILE}"

# Check if PDF was created
if [ -f "${OUTPUT_NAME}.pdf" ]; then
    echo "✅ Compilation successful! The PDF is saved as ${OUTPUT_NAME}.pdf"
    ls -la "${OUTPUT_NAME}.pdf"
else
    echo "❌ pdflatex compilation failed. Trying pandoc as fallback..."
    
    # Try pandoc as alternative
    if command -v pandoc >/dev/null 2>&1; then
        echo "🔄 Trying pandoc conversion..."
        pandoc "${RESUME_FILE}" -o "${OUTPUT_NAME}.pdf" 2>/dev/null
        if [ -f "${OUTPUT_NAME}.pdf" ]; then
            echo "✅ Pandoc conversion successful!"
            ls -la "${OUTPUT_NAME}.pdf"
        else
            echo "❌ Pandoc conversion also failed."
            echo "Check the log file for errors: ${OUTPUT_NAME}.log"
            exit 1
        fi
    else
        echo "❌ Pandoc not available. Compilation failed."
        echo "Check the log file for errors: ${OUTPUT_NAME}.log"
        exit 1
    fi
fi

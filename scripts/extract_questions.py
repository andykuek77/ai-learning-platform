import re
import json
from pathlib import Path

from pypdf import PdfReader


# --------------------------------------------------
# 1. Folder locations
# --------------------------------------------------

input_folder = Path("source-pdfs")
output_folder = Path("question-data")

# Create output folder if it does not already exist
output_folder.mkdir(exist_ok=True)


# --------------------------------------------------
# 2. Find all PDFs
# --------------------------------------------------

pdf_files = list(input_folder.glob("*.pdf"))

print("Found", len(pdf_files), "PDF file(s)")


# --------------------------------------------------
# 3. Process each PDF
# --------------------------------------------------

for pdf_path in pdf_files:

    print("\n===================================")
    print("Processing:", pdf_path.name)
    print("===================================")

    reader = PdfReader(pdf_path)

    all_text = ""

    # Extract text from every page
    for page in reader.pages:

        page_text = page.extract_text()

        if page_text:
            all_text += "\n" + page_text


    # --------------------------------------------------
    # 4. Locate Section A and Section B
    # --------------------------------------------------

    section_a_start = all_text.find(
        "Instructions for Section A"
    )

    section_b_start = all_text.find(
        "Instructions for Section B"
    )

    if section_a_start == -1:
        print("ERROR: Could not find Section A.")
        continue

    if section_b_start == -1:
        print("ERROR: Could not find Section B.")
        continue

    # Extract only Section A
    section_a_text = all_text[
        section_a_start:section_b_start
    ]


    # --------------------------------------------------
    # 5. Find question blocks
    # --------------------------------------------------

    question_pattern = (
        r"(\d+)\.\s+(.*?)"
        r"(?=\n\d+\.\s+|\Z)"
    )

    matches = re.findall(
        question_pattern,
        section_a_text,
        flags=re.DOTALL
    )

    questions = []


    # --------------------------------------------------
    # 6. Process each question
    # --------------------------------------------------

    for number, block in matches:

        # Find options such as:
        # (1) 692
        # (2) 866
        # (3) 779
        # (4) 1027

        option_matches = re.findall(
            r"\((\d)\)\s*(.+)",
            block
        )

        options = []

        for option_number, option_text in option_matches:
            options.append(
                option_text.strip()
            )


        # Question text is everything before option (1)

        question_text = re.split(
            r"\n\(1\)",
            block
        )[0].strip()


        # Create structured question object

        question = {
            "id": int(number),
            "type": "mcq",
            "question": question_text,
            "options": options,
            "marks": 2
        }

        questions.append(question)


    # --------------------------------------------------
    # 7. Save JSON
    # --------------------------------------------------

    output_name = pdf_path.stem + ".json"

    output_path = (
        output_folder / output_name
    )

    with open(
        output_path,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            questions,
            file,
            indent=2,
            ensure_ascii=False
        )


    # --------------------------------------------------
    # 8. Validation report
    # --------------------------------------------------

    print(
        "\nSaved",
        len(questions),
        "question(s)"
    )

    print("Output:", output_path)

    print("\nVALIDATION")
    print("----------")

    problems_found = False

    for q in questions:

        option_count = len(
            q["options"]
        )

        if option_count == 4:

            print(
                "Q" + str(q["id"]),
                "- 4 options ✓"
            )

        else:

            print(
                "Q" + str(q["id"]),
                "-",
                option_count,
                "options ⚠ CHECK"
            )

            problems_found = True


    # --------------------------------------------------
    # 9. Final status
    # --------------------------------------------------

    if len(questions) != 12:

        print(
            "\n⚠ WARNING:",
            len(questions),
            "questions were found."
        )

        print(
            "Expected 12 MCQs for this paper."
        )

        problems_found = True


    if problems_found:

        print(
            "\n⚠ Please inspect the JSON."
        )

    else:

        print(
            "\n✓ Extraction appears successful."
        )
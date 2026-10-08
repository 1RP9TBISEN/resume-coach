import os
from reportlab.pdfgen import canvas

def create_sample_pdf(path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    c = canvas.Canvas(path)
    c.drawString(100, 800, "Indra Krishna Patel — B.Tech Computer Science, AITR Indore (2023–2027).")
    c.drawString(100, 780, "Skills: C++, DSA, JavaScript, React, HTML/CSS, Git, Python basics.")
    c.drawString(100, 760, "Projects: EdgeTrack — React trading journal to log trades, tag strategies and review P&L;")
    c.drawString(100, 740, "Crop disease detection app — image classification model to identify leaf diseases and suggest remedies.")
    c.drawString(100, 720, "Hackathons: participated in MLH events.")
    c.save()

if __name__ == "__main__":
    create_sample_pdf("backend/samples/sample_resume.pdf")
    print("PDF created.")

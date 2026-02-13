import jsPDF from "jspdf";

interface Message {
    role: "user" | "assistant";
    content: string;
}

export function generateFitnessReport(messages: Message[]) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    const checkPageBreak = (needed: number) => {
        if (y + needed > pageHeight - margin) {
            doc.addPage();
            y = margin;
            // Add subtle header on new pages
            doc.setFontSize(8);
            doc.setTextColor(120, 120, 120);
            doc.text("FitCoach AI — Fitness Report", margin, 12);
            doc.setDrawColor(220, 220, 220);
            doc.line(margin, 14, pageWidth - margin, 14);
            y = 22;
        }
    };

    // ===== HEADER BANNER =====
    doc.setFillColor(16, 185, 129); // emerald-500
    doc.rect(0, 0, pageWidth, 45, "F");

    // Accent stripe
    doc.setFillColor(13, 148, 103);
    doc.rect(0, 42, pageWidth, 3, "F");

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("FitCoach AI", margin, 22);

    // Subtitle
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Personal Fitness Report", margin, 32);

    // Date
    const date = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });
    doc.setFontSize(9);
    doc.text(date, pageWidth - margin, 32, { align: "right" });

    y = 55;

    // ===== SUMMARY SECTION =====
    doc.setTextColor(16, 185, 129);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Session Summary", margin, y);
    y += 3;
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + 40, y);
    y += 8;

    // Stats
    const userMessages = messages.filter((m) => m.role === "user");
    const aiMessages = messages.filter((m) => m.role === "assistant");

    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    const stats = [
        `Total Messages: ${messages.length}`,
        `Your Questions: ${userMessages.length}`,
        `Coach Responses: ${aiMessages.length}`,
        `Report Generated: ${new Date().toLocaleTimeString()}`,
    ];

    stats.forEach((stat) => {
        doc.text(`•  ${stat}`, margin + 2, y);
        y += 6;
    });

    y += 6;

    // ===== TOPICS DISCUSSED =====
    const topics = extractTopics(messages);
    if (topics.length > 0) {
        checkPageBreak(30);
        doc.setTextColor(16, 185, 129);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Topics Discussed", margin, y);
        y += 3;
        doc.setDrawColor(16, 185, 129);
        doc.line(margin, y, margin + 40, y);
        y += 8;

        doc.setTextColor(60, 60, 60);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");

        // Topic pills as text
        topics.forEach((topic) => {
            checkPageBreak(8);
            doc.setFillColor(240, 253, 244); // emerald-50
            doc.roundedRect(margin + 2, y - 4, doc.getTextWidth(topic) + 8, 7, 2, 2, "F");
            doc.setTextColor(16, 150, 110);
            doc.text(topic, margin + 6, y);
            y += 10;
        });
        y += 4;
    }

    // ===== CONVERSATION LOG =====
    checkPageBreak(20);
    doc.setTextColor(16, 185, 129);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Conversation Log", margin, y);
    y += 3;
    doc.setDrawColor(16, 185, 129);
    doc.line(margin, y, margin + 40, y);
    y += 10;

    messages.forEach((msg) => {
        const isUser = msg.role === "user";
        const label = isUser ? "YOU" : "FITCOACH AI";
        const cleanContent = msg.content.replace(/[^\x20-\x7E\n]/g, "").trim();

        // Label
        checkPageBreak(16);
        if (isUser) {
            doc.setFillColor(16, 185, 129);
            doc.roundedRect(margin, y - 4, doc.getTextWidth(label) + 8, 7, 2, 2, "F");
            doc.setTextColor(255, 255, 255);
        } else {
            doc.setFillColor(243, 244, 246);
            doc.roundedRect(margin, y - 4, doc.getTextWidth(label) + 8, 7, 2, 2, "F");
            doc.setTextColor(55, 65, 81);
        }
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text(label, margin + 4, y);
        y += 8;

        // Message content
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");

        const lines = doc.splitTextToSize(cleanContent, contentWidth - 4);
        lines.forEach((line: string) => {
            checkPageBreak(6);
            doc.text(line, margin + 2, y);
            y += 5;
        });

        y += 6;

        // Divider between messages
        checkPageBreak(4);
        doc.setDrawColor(230, 230, 230);
        doc.setLineWidth(0.2);
        doc.line(margin, y, pageWidth - margin, y);
        y += 8;
    });

    // ===== FOOTER =====
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
            "Generated by FitCoach AI — Your Personal Fitness Coach",
            pageWidth / 2,
            pageHeight - 10,
            { align: "center" }
        );
        doc.text(
            `Page ${i} of ${totalPages}`,
            pageWidth - margin,
            pageHeight - 10,
            { align: "right" }
        );
    }

    // Save
    const timestamp = new Date().toISOString().slice(0, 10);
    doc.save(`FitCoach_Report_${timestamp}.pdf`);
}

function extractTopics(messages: Message[]): string[] {
    const topicKeywords: { [key: string]: string } = {
        workout: "Workout Plans",
        exercise: "Exercise Routines",
        cardio: "Cardio Training",
        strength: "Strength Training",
        weight: "Weight Management",
        diet: "Diet & Nutrition",
        nutrition: "Diet & Nutrition",
        protein: "Protein & Macros",
        meal: "Meal Planning",
        stretch: "Stretching & Flexibility",
        recovery: "Recovery",
        sleep: "Sleep & Rest",
        running: "Running",
        yoga: "Yoga",
        hiit: "HIIT Training",
        abs: "Core Training",
        muscle: "Muscle Building",
        fat: "Fat Loss",
        beginner: "Beginner Fitness",
        motivation: "Motivation",
        injury: "Injury Prevention",
        flexibility: "Flexibility",
        calorie: "Calorie Tracking",
    };

    const found = new Set<string>();
    const allText = messages.map((m) => m.content.toLowerCase()).join(" ");

    Object.entries(topicKeywords).forEach(([keyword, topic]) => {
        if (allText.includes(keyword)) {
            found.add(topic);
        }
    });

    return Array.from(found).slice(0, 8); // max 8 topics
}

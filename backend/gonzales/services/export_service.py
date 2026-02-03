import csv
import io
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from gonzales.db.models import Measurement


class ExportService:
    CSV_COLUMNS = [
        "id",
        "timestamp",
        "download_mbps",
        "upload_mbps",
        "ping_latency_ms",
        "ping_jitter_ms",
        "packet_loss_pct",
        "isp",
        "server_name",
        "server_location",
        "below_download_threshold",
        "below_upload_threshold",
    ]

    def generate_csv(self, measurements: list[Measurement]) -> str:
        output = io.StringIO()
        # Gonzales branding header
        output.write("# Gonzales Speed Test Export\n")
        output.write("# https://github.com/akustikrausch/gonzales\n")
        output.write(f"# Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        output.write("#\n")
        writer = csv.writer(output)
        writer.writerow(self.CSV_COLUMNS)
        for m in measurements:
            writer.writerow([
                m.id,
                m.timestamp.isoformat(),
                round(m.download_mbps, 2),
                round(m.upload_mbps, 2),
                round(m.ping_latency_ms, 2),
                round(m.ping_jitter_ms, 2),
                round(m.packet_loss_pct, 2) if m.packet_loss_pct is not None else "",
                m.isp,
                m.server_name,
                m.server_location,
                m.below_download_threshold,
                m.below_upload_threshold,
            ])
        return output.getvalue()

    def generate_pdf(
        self,
        measurements: list[Measurement],
        stats: dict | None = None,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> bytes:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=landscape(A4),
            leftMargin=15 * mm,
            rightMargin=15 * mm,
            topMargin=15 * mm,
            bottomMargin=15 * mm,
        )
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            "GonzalesTitle",
            parent=styles["Title"],
            fontSize=20,
            spaceAfter=6 * mm,
        )

        elements = []
        elements.append(Paragraph("Gonzales Speed Test Report", title_style))

        date_range = "All time"
        if start_date and end_date:
            date_range = f"{start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}"
        elif start_date:
            date_range = f"From {start_date.strftime('%Y-%m-%d')}"
        elif end_date:
            date_range = f"Until {end_date.strftime('%Y-%m-%d')}"
        elements.append(Paragraph(f"Period: {date_range}", styles["Normal"]))
        elements.append(Paragraph(f"Total tests: {len(measurements)}", styles["Normal"]))
        elements.append(Spacer(1, 6 * mm))

        if stats:
            summary_data = [
                ["Metric", "Min", "Max", "Average", "Median"],
            ]
            for label, key in [("Download (Mbps)", "download"), ("Upload (Mbps)", "upload"), ("Ping (ms)", "ping")]:
                s = stats.get(key)
                if s:
                    summary_data.append([
                        label,
                        f"{s['min']:.2f}",
                        f"{s['max']:.2f}",
                        f"{s['avg']:.2f}",
                        f"{s['median']:.2f}",
                    ])
            if len(summary_data) > 1:
                summary_table = Table(summary_data, repeatRows=1)
                summary_table.setStyle(TableStyle([
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#007AFF")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 9),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F5F5F5")]),
                    ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
                ]))
                elements.append(Paragraph("Summary Statistics", styles["Heading2"]))
                elements.append(summary_table)
                elements.append(Spacer(1, 6 * mm))

        headers = ["#", "Timestamp", "DL (Mbps)", "UL (Mbps)", "Ping (ms)", "Jitter (ms)", "ISP", "Server"]
        table_data = [headers]
        for m in measurements[-100:]:
            table_data.append([
                str(m.id),
                m.timestamp.strftime("%Y-%m-%d %H:%M"),
                f"{m.download_mbps:.1f}",
                f"{m.upload_mbps:.1f}",
                f"{m.ping_latency_ms:.1f}",
                f"{m.ping_jitter_ms:.1f}",
                m.isp[:20],
                m.server_name[:20],
            ])

        table = Table(table_data, repeatRows=1)
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#007AFF")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F5F5F5")]),
            ("ALIGN", (0, 0), (0, -1), "RIGHT"),
            ("ALIGN", (2, 0), (5, -1), "RIGHT"),
        ]))
        elements.append(Paragraph("Measurements", styles["Heading2"]))
        elements.append(table)

        # Gonzales branding footer
        elements.append(Spacer(1, 10 * mm))
        footer_style = ParagraphStyle(
            "GonzalesFooter",
            parent=styles["Normal"],
            fontSize=8,
            textColor=colors.grey,
            alignment=1,  # center
        )
        elements.append(Paragraph(
            "Generated by Gonzales Speed Monitor — "
            '<a href="https://github.com/akustikrausch/gonzales" color="blue">'
            "https://github.com/akustikrausch/gonzales</a>",
            footer_style,
        ))

        doc.build(elements)
        return buffer.getvalue()


export_service = ExportService()

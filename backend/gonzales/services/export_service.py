import csv
import hashlib
import io
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from gonzales.config import settings
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
        # Contract/threshold information (Soll-Stand)
        output.write(f"# Subscribed Download: {settings.download_threshold_mbps:.0f} Mbps\n")
        output.write(f"# Subscribed Upload: {settings.upload_threshold_mbps:.0f} Mbps\n")
        output.write(f"# Tolerance: {settings.tolerance_percent:.0f}%\n")
        tolerance_factor = 1 - (settings.tolerance_percent / 100)
        eff_dl = settings.download_threshold_mbps * tolerance_factor
        eff_ul = settings.upload_threshold_mbps * tolerance_factor
        output.write(f"# Effective Min Download: {eff_dl:.0f} Mbps\n")
        output.write(f"# Effective Min Upload: {eff_ul:.0f} Mbps\n")
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

        # Contract vs. Actual comparison (Soll vs. Ist)
        if measurements:
            tolerance_factor = 1 - (settings.tolerance_percent / 100)
            eff_dl = settings.download_threshold_mbps * tolerance_factor
            eff_ul = settings.upload_threshold_mbps * tolerance_factor
            avg_dl = sum(m.download_mbps for m in measurements) / len(measurements)
            avg_ul = sum(m.upload_mbps for m in measurements) / len(measurements)

            dl_status = "OK" if avg_dl >= eff_dl else "Below"
            ul_status = "OK" if avg_ul >= eff_ul else "Below"

            contract_data = [
                ["Metric", "Contracted", "Min Required", "Avg Actual", "Status"],
                [
                    "Download",
                    f"{settings.download_threshold_mbps:.0f} Mbps",
                    f"{eff_dl:.0f} Mbps",
                    f"{avg_dl:.1f} Mbps",
                    dl_status,
                ],
                [
                    "Upload",
                    f"{settings.upload_threshold_mbps:.0f} Mbps",
                    f"{eff_ul:.0f} Mbps",
                    f"{avg_ul:.1f} Mbps",
                    ul_status,
                ],
            ]
            contract_table = Table(contract_data, repeatRows=1)

            # Color the status column based on OK/Below
            table_style = [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#007AFF")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F5F5F5")]),
                ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
            ]
            # Color status cells
            if dl_status == "Below":
                table_style.append(("TEXTCOLOR", (4, 1), (4, 1), colors.HexColor("#EF4444")))
            else:
                table_style.append(("TEXTCOLOR", (4, 1), (4, 1), colors.HexColor("#22C55E")))
            if ul_status == "Below":
                table_style.append(("TEXTCOLOR", (4, 2), (4, 2), colors.HexColor("#EF4444")))
            else:
                table_style.append(("TEXTCOLOR", (4, 2), (4, 2), colors.HexColor("#22C55E")))

            contract_table.setStyle(TableStyle(table_style))
            elements.append(Paragraph("Contract vs. Actual", styles["Heading2"]))
            elements.append(contract_table)
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

    def generate_professional_report(
        self,
        measurements: list[Measurement],
        enhanced_stats: dict | None = None,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> bytes:
        """Generate a professional compliance report with detailed analysis."""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=20 * mm,
            rightMargin=20 * mm,
            topMargin=20 * mm,
            bottomMargin=20 * mm,
        )
        styles = getSampleStyleSheet()

        # Custom styles
        title_style = ParagraphStyle(
            "ReportTitle",
            parent=styles["Title"],
            fontSize=24,
            spaceAfter=6 * mm,
            textColor=colors.HexColor("#1a1a2e"),
        )
        heading_style = ParagraphStyle(
            "ReportHeading",
            parent=styles["Heading1"],
            fontSize=14,
            spaceAfter=4 * mm,
            spaceBefore=8 * mm,
            textColor=colors.HexColor("#007AFF"),
        )
        subheading_style = ParagraphStyle(
            "ReportSubheading",
            parent=styles["Heading2"],
            fontSize=11,
            spaceAfter=3 * mm,
            spaceBefore=4 * mm,
        )
        normal_style = ParagraphStyle(
            "ReportNormal",
            parent=styles["Normal"],
            fontSize=10,
            spaceAfter=2 * mm,
        )
        small_style = ParagraphStyle(
            "ReportSmall",
            parent=styles["Normal"],
            fontSize=8,
            textColor=colors.grey,
        )

        elements = []

        # === COVER PAGE ===
        elements.append(Spacer(1, 40 * mm))
        elements.append(Paragraph("Internet Performance Report", title_style))
        elements.append(Spacer(1, 10 * mm))

        # Date range
        if start_date and end_date:
            date_range = f"{start_date.strftime('%d.%m.%Y')} - {end_date.strftime('%d.%m.%Y')}"
        elif start_date:
            date_range = f"From {start_date.strftime('%d.%m.%Y')}"
        elif end_date:
            date_range = f"Until {end_date.strftime('%d.%m.%Y')}"
        else:
            date_range = "Complete measurement period"

        cover_info = [
            ["Period:", date_range],
            ["Total Measurements:", str(len(measurements))],
            ["Subscribed Download:", f"{settings.download_threshold_mbps:.0f} Mbps"],
            ["Subscribed Upload:", f"{settings.upload_threshold_mbps:.0f} Mbps"],
            ["Tolerance:", f"{settings.tolerance_percent:.0f}%"],
        ]
        if settings.isp_name:
            cover_info.insert(0, ["Provider:", settings.isp_name])

        cover_table = Table(cover_info, colWidths=[50 * mm, 80 * mm])
        cover_table.setStyle(TableStyle([
            ("FONTSIZE", (0, 0), (-1, -1), 11),
            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4 * mm),
            ("TOPPADDING", (0, 0), (-1, -1), 2 * mm),
        ]))
        elements.append(cover_table)

        elements.append(Spacer(1, 20 * mm))
        gen_time = datetime.now().strftime("%d.%m.%Y %H:%M:%S")
        elements.append(Paragraph(f"Generated: {gen_time}", small_style))
        elements.append(PageBreak())

        # === EXECUTIVE SUMMARY ===
        elements.append(Paragraph("Executive Summary", heading_style))

        if measurements:
            # Calculate statistics
            total = len(measurements)
            tolerance_factor = 1 - (settings.tolerance_percent / 100)
            eff_dl = settings.download_threshold_mbps * tolerance_factor
            eff_ul = settings.upload_threshold_mbps * tolerance_factor

            dl_compliant = sum(1 for m in measurements if m.download_mbps >= eff_dl)
            ul_compliant = sum(1 for m in measurements if m.upload_mbps >= eff_ul)
            both_compliant = sum(
                1 for m in measurements
                if m.download_mbps >= eff_dl and m.upload_mbps >= eff_ul
            )

            dl_pct = (dl_compliant / total * 100) if total > 0 else 0
            ul_pct = (ul_compliant / total * 100) if total > 0 else 0
            both_pct = (both_compliant / total * 100) if total > 0 else 0

            avg_dl = sum(m.download_mbps for m in measurements) / total
            avg_ul = sum(m.upload_mbps for m in measurements) / total
            avg_ping = sum(m.ping_latency_ms for m in measurements) / total

            # Summary table
            summary_data = [
                ["Metric", "Value", "Compliance"],
                ["Average Download", f"{avg_dl:.1f} Mbps", f"{dl_pct:.1f}%"],
                ["Average Upload", f"{avg_ul:.1f} Mbps", f"{ul_pct:.1f}%"],
                ["Average Latency", f"{avg_ping:.1f} ms", "-"],
                ["Overall Compliance", "-", f"{both_pct:.1f}%"],
            ]

            summary_table = Table(summary_data, colWidths=[60 * mm, 50 * mm, 40 * mm])
            summary_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#007AFF")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8F8F8")]),
                ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
            ]))
            elements.append(summary_table)
            elements.append(Spacer(1, 6 * mm))

            # ISP Score if available
            if enhanced_stats and enhanced_stats.get("isp_score"):
                isp_score = enhanced_stats["isp_score"]
                score_color = (
                    colors.HexColor("#22C55E") if isp_score["composite"] >= 80
                    else colors.HexColor("#EAB308") if isp_score["composite"] >= 60
                    else colors.HexColor("#EF4444")
                )
                elements.append(Paragraph(
                    f"<b>Performance Rating:</b> {isp_score['grade']} ({isp_score['composite']:.0f}/100)",
                    normal_style,
                ))

        # === DETAILED STATISTICS ===
        elements.append(Paragraph("Detailed Statistics", heading_style))

        if measurements:
            # Distribution table
            dl_values = sorted([m.download_mbps for m in measurements])
            ul_values = sorted([m.upload_mbps for m in measurements])
            ping_values = sorted([m.ping_latency_ms for m in measurements])

            def percentile(vals: list, p: float) -> float:
                if not vals:
                    return 0
                k = (len(vals) - 1) * (p / 100)
                f = int(k)
                c = min(f + 1, len(vals) - 1)
                return vals[f] + (vals[c] - vals[f]) * (k - f)

            dist_data = [
                ["Metric", "Min", "5th %", "Median", "95th %", "Max"],
                [
                    "Download (Mbps)",
                    f"{dl_values[0]:.1f}",
                    f"{percentile(dl_values, 5):.1f}",
                    f"{percentile(dl_values, 50):.1f}",
                    f"{percentile(dl_values, 95):.1f}",
                    f"{dl_values[-1]:.1f}",
                ],
                [
                    "Upload (Mbps)",
                    f"{ul_values[0]:.1f}",
                    f"{percentile(ul_values, 5):.1f}",
                    f"{percentile(ul_values, 50):.1f}",
                    f"{percentile(ul_values, 95):.1f}",
                    f"{ul_values[-1]:.1f}",
                ],
                [
                    "Latency (ms)",
                    f"{ping_values[0]:.1f}",
                    f"{percentile(ping_values, 5):.1f}",
                    f"{percentile(ping_values, 50):.1f}",
                    f"{percentile(ping_values, 95):.1f}",
                    f"{ping_values[-1]:.1f}",
                ],
            ]

            dist_table = Table(dist_data, repeatRows=1)
            dist_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#007AFF")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8F8F8")]),
                ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
            ]))
            elements.append(dist_table)

        # === TIME PERIOD ANALYSIS ===
        if enhanced_stats and enhanced_stats.get("time_periods"):
            elements.append(Paragraph("Time Period Analysis", heading_style))

            time_periods = enhanced_stats["time_periods"]["periods"]
            period_data = [["Period", "Hours", "Avg Download", "Avg Upload", "Compliance"]]
            for p in time_periods:
                period_data.append([
                    p["period_label"],
                    p["hours"],
                    f"{p['avg_download_mbps']:.1f} Mbps",
                    f"{p['avg_upload_mbps']:.1f} Mbps",
                    f"{p['compliance_pct']:.1f}%",
                ])

            period_table = Table(period_data, repeatRows=1)
            period_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#007AFF")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8F8F8")]),
                ("ALIGN", (2, 0), (-1, -1), "RIGHT"),
            ]))
            elements.append(period_table)

        # === VIOLATIONS LIST ===
        elements.append(Paragraph("Performance Events", heading_style))

        violations = [m for m in measurements if m.below_download_threshold or m.below_upload_threshold]

        if violations:
            elements.append(Paragraph(
                f"Total events below threshold: {len(violations)} ({len(violations)/len(measurements)*100:.1f}%)",
                normal_style,
            ))

            # Show first 50 violations
            violation_data = [["Date/Time", "Download", "Expected", "Difference"]]
            for v in violations[:50]:
                expected_dl = settings.download_threshold_mbps * tolerance_factor
                diff = v.download_mbps - expected_dl
                diff_pct = (diff / expected_dl * 100) if expected_dl > 0 else 0
                violation_data.append([
                    v.timestamp.strftime("%d.%m.%Y %H:%M"),
                    f"{v.download_mbps:.1f} Mbps",
                    f"{expected_dl:.1f} Mbps",
                    f"{diff_pct:+.1f}%",
                ])

            violation_table = Table(violation_data, repeatRows=1)
            violation_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#EF4444")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#FEF2F2")]),
                ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
            ]))
            elements.append(violation_table)

            if len(violations) > 50:
                elements.append(Paragraph(
                    f"... and {len(violations) - 50} more events",
                    small_style,
                ))
        else:
            elements.append(Paragraph("No performance events recorded.", normal_style))

        # === METHODOLOGY ===
        elements.append(PageBreak())
        elements.append(Paragraph("Methodology", heading_style))

        methodology_text = f"""
        <b>Measurement Method:</b> Ookla Speedtest CLI<br/>
        <b>Test Interval:</b> Every {settings.test_interval_minutes} minutes<br/>
        <b>Download Threshold:</b> {settings.download_threshold_mbps:.0f} Mbps<br/>
        <b>Upload Threshold:</b> {settings.upload_threshold_mbps:.0f} Mbps<br/>
        <b>Tolerance:</b> {settings.tolerance_percent:.0f}% (effective minimum: {settings.download_threshold_mbps * tolerance_factor:.0f}/{settings.upload_threshold_mbps * tolerance_factor:.0f} Mbps)<br/>
        <b>Total Measurements:</b> {len(measurements)}<br/>
        """
        elements.append(Paragraph(methodology_text, normal_style))

        # === DOCUMENT INTEGRITY ===
        elements.append(Spacer(1, 10 * mm))
        elements.append(Paragraph("Document Integrity", subheading_style))

        # Create hash of measurement data
        hash_data = "|".join([
            f"{m.id}:{m.timestamp.isoformat()}:{m.download_mbps:.2f}:{m.upload_mbps:.2f}"
            for m in measurements
        ])
        doc_hash = hashlib.sha256(hash_data.encode()).hexdigest()

        elements.append(Paragraph(
            f"<b>SHA-256 Checksum:</b> {doc_hash[:32]}...{doc_hash[-8:]}",
            small_style,
        ))
        elements.append(Paragraph(
            f"<b>Generated:</b> {gen_time}",
            small_style,
        ))

        # Footer
        elements.append(Spacer(1, 15 * mm))
        footer_style = ParagraphStyle(
            "ReportFooter",
            parent=styles["Normal"],
            fontSize=8,
            textColor=colors.grey,
            alignment=1,
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

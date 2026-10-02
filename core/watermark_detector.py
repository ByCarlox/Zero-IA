"""Forensic AI Watermark & Steganography Detection Engine.
Reverse-engineered from Guillaume Meyer's watermarks-remover (Layer A & Layer B).
Detects covert Unicode watermarking, steganographic tokens, vendor signatures (Claude, OpenAI, etc.),
and computes the physical watermark contribution to the global AI probability score.
"""
from core.engine_bridge import call_engine

def detect_invisible_watermarks(text):
    """Scan text for covert steganographic watermarks and formatting codepoints.
    
    Returns a comprehensive forensic dictionary:
    - hasWatermark (bool): True if covert AI watermarks are confirmed.
    - hasFormatting (bool): True if any format or invisible characters exist.
    - covertWatermarksCount (int): Number of confirmed covert watermark signals.
    - watermarkScoreContribution (int): Contribution percentage (+0% to +100%) to AI score.
    - watermarkConfidence (int): Statistical confidence percentage of physical watermark.
    - watermarkDensityPer1k (float): Watermark markers per 1,000 characters.
    - vendorSignatures (list[str]): Identified vendor watermarking fingerprints (e.g. Claude ZWSP).
    - positions (list[dict]): Detailed span locations, hex codepoint, category, and context.
    - message (str): Human-readable forensic verdict.
    """
    return call_engine('unicode', text)

def strip_invisible_characters(text, aggressive=False):
    """Sanitize and disinfect text by stripping covert watermarks and initial BOM,
    while carefully preserving legitimate emoji presentation glue and complex script orthography.
    """
    return call_engine('clean', text, aggressive=aggressive)

def analyze_watermark_provenance(text):
    """Convenience forensic report summarizing watermark findings and AI score contribution."""
    report = detect_invisible_watermarks(text)
    return {
        'has_watermark': report.get('hasWatermark', False),
        'covert_count': report.get('covertWatermarksCount', 0),
        'ai_percentage_boost': report.get('watermarkScoreContribution', 0),
        'confidence': report.get('watermarkConfidence', 0),
        'density_per_1k': report.get('watermarkDensityPer1k', 0.0),
        'signatures': report.get('vendorSignatures', []),
        'status': report.get('status', 'clean'),
        'message': report.get('message', '')
    }

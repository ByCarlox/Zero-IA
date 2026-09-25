"""Unicode format diagnostics. Format characters do not establish provenance."""
from core.engine_bridge import call_engine

def detect_invisible_watermarks(text):
    return call_engine('unicode', text)

def strip_invisible_characters(text):
    """Remove only an initial BOM; preserve joins, direction marks and soft hyphens."""
    return call_engine('clean', text)

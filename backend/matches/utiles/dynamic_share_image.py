from io import BytesIO
from PIL import Image, UnidentifiedImageError
import requests

IMAGE_SIZE = (1200, 630)
BACKGROUND_COLOR = "#071018"
TEXT_COLOR = "#f7efe3"
LOGO_SIZE = (260, 260)


def download_image(url):
    r = requests.get(url, timeout=5)
    r.raise_for_status()
    return Image.open(BytesIO(r.content)).convert("RGBA")


def safe_download_image(url):
    #safe pcq on veut pas que le template
    # crash si l'image est pas dispo ou si y'a un pb de connexion
    #peut arriver en prod si on envoie le opengraph rapidement 
    # et que le serveur de l'image est lent ou down
    try:
        return download_image(url) if url else None
    except (requests.RequestException, UnidentifiedImageError, OSError):
        return None


def resize_logo(logo, size):
    return logo.resize(size, Image.Resampling.LANCZOS)


def create_background(size, color):
    return Image.new("RGB", size, color)


def paste_logo(background, logo, position):
    background.paste(logo, position, logo)


def save_image_to_bytes(image):
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


def generate_match_share_image(match):
    home_logo_url = match.home_team.logo
    away_logo_url = match.away_team.logo

    home_logo = safe_download_image(home_logo_url)
    away_logo = safe_download_image(away_logo_url)

    background = create_background(IMAGE_SIZE, BACKGROUND_COLOR)
    if away_logo:
        paste_logo(background, resize_logo(away_logo, LOGO_SIZE), (565, 185))
    if home_logo:
        paste_logo(background, resize_logo(home_logo, LOGO_SIZE), (380, 100))
    
    return save_image_to_bytes(background)

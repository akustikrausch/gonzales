import uvicorn

from gonzales.config import settings

BANNER = r"""
 ██████╗  ██████╗ ███╗   ██╗███████╗ █████╗ ██╗     ███████╗███████╗
██╔════╝ ██╔═══██╗████╗  ██║╚══███╔╝██╔══██╗██║     ██╔════╝██╔════╝
██║  ███╗██║   ██║██╔██╗ ██║  ███╔╝ ███████║██║     █████╗  ███████╗
██║   ██║██║   ██║██║╚██╗██║ ███╔╝  ██╔══██║██║     ██╔══╝  ╚════██║
╚██████╔╝╚██████╔╝██║ ╚████║███████╗██║  ██║███████╗███████╗███████║
 ╚═════╝  ╚═════╝ ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝
"""

CYAN = "\033[1;36m"
RESET = "\033[0m"


YELLOW = "\033[1;33m"


GREEN = "\033[1;32m"
DIM = "\033[2m"


def main() -> None:
    print(f"{CYAN}{BANNER}{RESET}")

    url = f"http://{settings.host}:{settings.port}"
    print(f"  {GREEN}Web Interface:{RESET}  {url}")
    print(f"  {DIM}Open this URL in your browser to access the dashboard.{RESET}")
    print()

    if settings.host != "127.0.0.1" and not settings.api_key:
        print(
            f"{YELLOW}WARNING: Binding to {settings.host} without an API key.{RESET}\n"
            f"{YELLOW}Mutating endpoints (trigger, config, delete) are unprotected.{RESET}\n"
            f"{YELLOW}Set GONZALES_API_KEY to secure your instance.{RESET}\n"
        )

    uvicorn.run(
        "gonzales.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level=settings.log_level.lower(),
    )


if __name__ == "__main__":
    main()

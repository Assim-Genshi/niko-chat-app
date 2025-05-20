{ pkgs, ... }: {
  # Which nixpkgs channel to use.
  channel = "stable-23.11"; # Or "unstable"

  # Use https://search.nixos.org/packages to find packages
  packages = [
    pkgs.nodejs-18_x
    pkgs.git
    pkgs.tailwindcss
    pkgs.nodePackages.eslint
    pkgs.nodePackages.prettier
    pkgs.nodePackages.postcss-cli # Needed for npx tailwindcss init -p
  ];

  # Sets environment variables in the workspace
  env = {};

  # Service definitions
  services = {};

  # Defines script shells.
  scripts = {};

  # Defines the preview window.
  previews = [
    {
      # Unique ID for this preview.
      id = "web";
      # Port to expose. This must match the port your application is listening on.
      port = 5173;
      # The command to run to start your application.
      start = "npm run dev";
      # Optional label for the preview window tab.
      label = "Vite App";
    }
  ];
}

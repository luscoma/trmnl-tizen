# How to setup tizen

Tizen is possibly the worst thing I've ever had to setup this is the best ways,
I've figured out how to do it so far.

There are two real ways to do this:

1. vscode extensions
2. tizen SDK


The second option is more CLI based and scriptable but a supreme pain to setup.

## The VS Code Extension

This option a relatively clunky extension but the SDK installation is automated
and is easier to get off the ground. 

To do this install two extensions:

1. Tizen Extension
2. Tizen TV Extension

I'm a bit unsure if you actually need 2 since this project doesn't use flutter
but I think it installs some SDK extensions so is required regardless.  In
either case the extensions will prompt you to install the SDK tools as part of
setup.

Once installed you can use the tizen extension to create certificates and build
the project.

To use vscode for building is going to be a bit clunky since this is setup to
use the CLI.  You'll need to run `bun run build` manually.  Then use tizen build
from the command palette to build. 

The easiest way to do this is to just open the tizen directory up directly since
it has the tizen web app XML file that is used by vs code.

## SDK installation

Step 1, download the tizen studio SDK with CLI install https://samsungtizenos.com/tools-download/

You can install it using the following

```
chmod +x web-cli_Tizen_Studio_10_macos-64.bin
./web-cli_Tizen_Studio_10_macos-64.bin --accept-license ~/tizen-studio
```

Once installed you need to launch the package manager app (there is a CLI
for this under tools/package-manager but for the life of me I couldn't get it
to work).

You want to install:

1. Tizen 10.0 WebApp Dev (IDE) and WebApp Dev (CLI)
2. Tizen SDK tools

You'll also need to install two extension sdks
1. TV Extensions-10.0
2. Samsung certificate manager


Once installed you need to run the new certificate manager app.  There is a CLI
for this but it doesn't seem to support requesting samsung distributor
certs so you're better off doing it through the UI.

Once the cert is created you need to configure the tizen CLI to use it:

```
tizen security-profiles add --active \
     --author path/to/author_cert.p12 --password XYZ \
     --dist path/to/dist_cert.p12 --dist-password XYZ \
     --name trmnl
tizen cli-config "profiles.path=~/tizen-studio-data/profile/profiles.xml"
```

Ensure sdb and tizen are in your path and you can now run `bun run package` or
`TV_IP=a.b.c.d bun run deploy`.  Note: Before the first deploy you will have
to manually:
- ensure dev mode is on so the app can be installed
- run `sdb connect $TV_IP`
- run `tizen install-permit`



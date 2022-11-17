import { WebView } from 'react-native-webview';

export function BookReader() {
    // TODO: Load the HTML in a better way
    // TODO: Portrait vs Landscape
    // TODO: I think the height of the iframe should only be as big as it needs to be, rather than 100%.
    //       I think it's preventing the "Play" button from being centered properly/
    // TODO: Get the book URL in a better way
    return (
        <WebView
            scalesPageToFit={true}
            style={{
                // FYI, there is one-pixel space where the WebView's style affects this one-pixel "border" around the Webview's source. borderWidth doesn't seem to help.
                backgroundColor: "#282c34",
            }}
            // The HTML head is 99% because 100% is slightly too big. (I'd guess it's 2 pixels too big, that "border" around the edge of it)
            source={{
                html: `
                    <!DOCTYPE html>
                    <html style="height: 99%; background-color: #282c34">
                        <head></head>
                        <body style="height: 100%">
                            <div id="baseDiv" style="height: 100%;">
                                <iframe style="width: 100%; height: 100%;" title="bloom player" src="https://dev.bloomlibrary.org/bloom-player/bloomplayer.htm?url=https%3A%2F%2Fs3.amazonaws.com%2Fbloomharvest-sandbox%2Fcolin_suggett%2540sil.org%252f885ba15f-97a7-4c83-ba3c-ae263607d9e6%2Fbloomdigital%252findex.htm&showBackButton=false&centerVertically=false&useOriginalPageSize=true&allowToggleAppBar=true&lang=en&hideFullScreenButton=false&independent=false&host=bloomlibrary" />
                            </div>
                        </body>
                    </html>
                `,
            }}
            automaticallyAdjustContentInsets={false}
        />
    );
}

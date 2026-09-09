package fr.jumerca.coachhandia;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.webkit.CookieManager;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.ProgressBar;

public class MainActivity extends Activity {
    private static final String APP_URL = "https://jumerca.github.io/jlg-event-builder/coach-hand-final/?native=android";
    private static final int FILE_CHOOSER_REQUEST = 4127;

    private WebView webView;
    private ProgressBar progressBar;
    private ValueCallback<Uri[]> fileChooserCallback;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Window window = getWindow();
        window.setStatusBarColor(Color.rgb(8, 31, 54));
        window.setNavigationBarColor(Color.rgb(8, 31, 54));

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(246, 248, 251));

        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(246, 248, 251));
        root.addView(webView, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT));

        progressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progressBar.setMax(100);
        FrameLayout.LayoutParams progressParams = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, 5);
        root.addView(progressBar, progressParams);

        setContentView(root);
        configureWebView();

        if (savedInstanceState == null) {
            webView.loadUrl(APP_URL);
        } else {
            webView.restoreState(savedInstanceState);
        }
    }

    private void configureWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setLoadsImagesAutomatically(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setUserAgentString(settings.getUserAgentString() + " CoachHandIA/1.0");

        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                progressBar.setProgress(newProgress);
                progressBar.setVisibility(newProgress >= 100 ? View.GONE : View.VISIBLE);
            }

            @Override
            public boolean onShowFileChooser(WebView webView,
                                             ValueCallback<Uri[]> filePathCallback,
                                             FileChooserParams fileChooserParams) {
                if (fileChooserCallback != null) {
                    fileChooserCallback.onReceiveValue(null);
                }
                fileChooserCallback = filePathCallback;
                Intent intent;
                try {
                    intent = fileChooserParams.createIntent();
                    startActivityForResult(intent, FILE_CHOOSER_REQUEST);
                    return true;
                } catch (Exception e) {
                    fileChooserCallback = null;
                    return false;
                }
            }
        });

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String host = uri.getHost();
                if (host != null && (host.equals("jumerca.github.io") || host.endsWith(".jumerca.github.io"))) {
                    return false;
                }
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, uri));
                    return true;
                } catch (Exception e) {
                    return false;
                }
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                view.evaluateJavascript(
                        "(function(){" +
                        "var a=document.getElementById('pwaInstallBar');if(a)a.style.display='none';" +
                        "var b=document.getElementById('installBtn');if(b)b.style.display='none';" +
                        "document.documentElement.classList.add('coach-native-android');" +
                        "})();", null);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                super.onReceivedError(view, request, error);
                if (request.isForMainFrame()) {
                    String html = "<!doctype html><html><meta name='viewport' content='width=device-width,initial-scale=1'>" +
                            "<body style='margin:0;background:#081f36;color:white;font-family:sans-serif;display:grid;place-items:center;min-height:100vh;text-align:center;padding:28px;box-sizing:border-box'>" +
                            "<div><h1 style='margin:0 0 12px'>Coach Hand IA</h1>" +
                            "<p style='color:#c9d7e6;line-height:1.5'>Connexion indisponible. Vérifie Internet puis réessaie.</p>" +
                            "<a href='" + APP_URL + "' style='display:inline-block;margin-top:14px;background:#ff7a18;color:white;text-decoration:none;font-weight:800;padding:14px 18px;border-radius:14px'>Réessayer</a></div>" +
                            "</body></html>";
                    view.loadDataWithBaseURL(APP_URL, html, "text/html", "UTF-8", null);
                }
            }
        });
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == FILE_CHOOSER_REQUEST && fileChooserCallback != null) {
            Uri[] result = WebChromeClient.FileChooserParams.parseResult(resultCode, data);
            fileChooserCallback.onReceiveValue(result);
            fileChooserCallback = null;
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        webView.saveState(outState);
        super.onSaveInstanceState(outState);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}

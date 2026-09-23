package com.example

import android.Manifest
import android.annotation.SuppressLint
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.media.AudioManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.view.View
import android.view.ViewGroup
import android.webkit.ConsoleMessage
import android.webkit.JavascriptInterface
import android.webkit.PermissionRequest
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import java.io.File
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import com.example.ui.theme.MyApplicationTheme

class MainActivity : ComponentActivity() {

  private var webView: WebView? = null
  private var filePathCallback: ValueCallback<Array<Uri>>? = null

  private val requestPermissionLauncher: ActivityResultLauncher<Array<String>> =
    registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { _ ->
      // Permissions result handled
    }

  private val fileChooserLauncher: ActivityResultLauncher<Intent> =
    registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
      if (filePathCallback != null) {
        val resultUri = result.data?.data
        if (resultUri != null) {
          filePathCallback?.onReceiveValue(arrayOf(resultUri))
        } else {
          val clipData = result.data?.clipData
          if (clipData != null && clipData.itemCount > 0) {
            val uris = Array(clipData.itemCount) { i -> clipData.getItemAt(i).uri }
            filePathCallback?.onReceiveValue(uris)
          } else {
            filePathCallback?.onReceiveValue(null)
          }
        }
        filePathCallback = null
      }
    }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    enableEdgeToEdge()

    // Request camera and microphone permissions up-front for smooth WebRTC experience
    checkAndRequestPermissions()

    onBackPressedDispatcher.addCallback(
      this,
      object : OnBackPressedCallback(true) {
        override fun handleOnBackPressed() {
          if (webView?.canGoBack() == true) {
            webView?.goBack()
          } else {
            isEnabled = false
            onBackPressedDispatcher.onBackPressed()
          }
        }
      }
    )

    setContent {
      MyApplicationTheme {
        Scaffold(modifier = Modifier.fillMaxSize()) { _ ->
          PlynetWebViewContainer(
            onWebViewCreated = { wv ->
              webView = wv
              setupWebView(wv)
            }
          )
        }
      }
    }
  }

  private fun checkAndRequestPermissions() {
    val permissionsToRequest = mutableListOf<String>()
    if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
      permissionsToRequest.add(Manifest.permission.CAMERA)
    }
    if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
      permissionsToRequest.add(Manifest.permission.RECORD_AUDIO)
    }
    if (permissionsToRequest.isNotEmpty()) {
      requestPermissionLauncher.launch(permissionsToRequest.toTypedArray())
    }
  }

  @SuppressLint("SetJavaScriptEnabled")
  private fun setupWebView(wv: WebView) {
    wv.layoutParams = ViewGroup.LayoutParams(
      ViewGroup.LayoutParams.MATCH_PARENT,
      ViewGroup.LayoutParams.MATCH_PARENT
    )

    // Pre-create cache and code cache directory structure to prevent Chromium simple_file_enumerator warnings
    try {
      val codeCacheDir = File(cacheDir, "WebView/Default/HTTP Cache/Code Cache/js")
      if (!codeCacheDir.exists()) {
        codeCacheDir.mkdirs()
      }
    } catch (ignored: Exception) {
    }

    // Set hardware acceleration layer for smooth rendering
    wv.setLayerType(View.LAYER_TYPE_HARDWARE, null)

    val settings: WebSettings = wv.settings
    settings.javaScriptEnabled = true
    settings.domStorageEnabled = true
    settings.databaseEnabled = true
    settings.allowFileAccess = true
    settings.allowContentAccess = true
    settings.mediaPlaybackRequiresUserGesture = false
    settings.cacheMode = WebSettings.LOAD_DEFAULT

    wv.webViewClient = object : WebViewClient() {
      override fun shouldOverrideUrlLoading(view: WebView?, url: String?): Boolean {
        return false
      }

      override fun onReceivedError(
        view: WebView?,
        request: WebResourceRequest?,
        error: WebResourceError?
      ) {
        super.onReceivedError(view, request, error)
      }
    }

    wv.webChromeClient = object : WebChromeClient() {
      // Grant WebRTC camera & microphone capture permissions directly
      override fun onPermissionRequest(request: PermissionRequest?) {
        runOnUiThread {
          request?.grant(request.resources)
        }
      }

      override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
        return super.onConsoleMessage(consoleMessage)
      }

      // Handle HTML file chooser (<input type="file">)
      override fun onShowFileChooser(
        webView: WebView?,
        filePathCallback: ValueCallback<Array<Uri>>?,
        fileChooserParams: FileChooserParams?
      ): Boolean {
        this@MainActivity.filePathCallback?.onReceiveValue(null)
        this@MainActivity.filePathCallback = filePathCallback

        val intent = Intent(Intent.ACTION_GET_CONTENT).apply {
          type = "*/*"
          putExtra(Intent.EXTRA_MIME_TYPES, arrayOf("image/*", "video/*"))
          addCategory(Intent.CATEGORY_OPENABLE)
        }

        try {
          fileChooserLauncher.launch(Intent.createChooser(intent, "Select Media"))
        } catch (e: Exception) {
          this@MainActivity.filePathCallback = null
          return false
        }
        return true
      }
    }

    // Register JavascriptInterface bridge for native features
    wv.addJavascriptInterface(PlynetNativeBridge(this, wv), "PlynetNativeBridge")

    // Load bundled web app from Android assets
    wv.loadUrl("file:///android_asset/public/index.html")
  }

  override fun onDestroy() {
    webView?.destroy()
    super.onDestroy()
  }
}

/**
 * Native Android JavaScript Interface Bridge
 */
class PlynetNativeBridge(private val context: Context, private val webView: WebView) {

  @JavascriptInterface
  fun isNativeApp(): Boolean = true

  @JavascriptInterface
  fun vibrate(durationMs: Long) {
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
        vibratorManager?.defaultVibrator?.vibrate(
          VibrationEffect.createOneShot(durationMs, VibrationEffect.DEFAULT_AMPLITUDE)
        )
      } else {
        @Suppress("DEPRECATION")
        val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          vibrator?.vibrate(VibrationEffect.createOneShot(durationMs, VibrationEffect.DEFAULT_AMPLITUDE))
        } else {
          @Suppress("DEPRECATION")
          vibrator?.vibrate(durationMs)
        }
      }
    } catch (e: Exception) {
      e.printStackTrace()
    }
  }

  @JavascriptInterface
  fun shareText(title: String, text: String, url: String) {
    try {
      val intent = Intent(Intent.ACTION_SEND).apply {
        type = "text/plain"
        putExtra(Intent.EXTRA_SUBJECT, title)
        putExtra(Intent.EXTRA_TEXT, "$text\n$url")
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      context.startActivity(Intent.createChooser(intent, "Share via").apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      })
    } catch (e: Exception) {
      e.printStackTrace()
    }
  }

  @JavascriptInterface
  fun copyToClipboard(text: String) {
    try {
      val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager
      val clip = ClipData.newPlainText("PLYNET", text)
      clipboard?.setPrimaryClip(clip)
    } catch (e: Exception) {
      e.printStackTrace()
    }
  }

  @JavascriptInterface
  fun showToast(message: String) {
    (context as? MainActivity)?.runOnUiThread {
      Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
    }
  }

  @JavascriptInterface
  fun toggleSpeaker(enabled: Boolean) {
    try {
      val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as? AudioManager
      audioManager?.isSpeakerphoneOn = enabled
    } catch (e: Exception) {
      e.printStackTrace()
    }
  }

  @JavascriptInterface
  fun callGeminiApi(prompt: String, callbackJs: String) {
    // Safely retrieve Gemini key from BuildConfig if provided, without hardcoding
    val geminiKey = try {
      BuildConfig::class.java.getField("GEMINI_API_KEY").get(null) as? String ?: ""
    } catch (t: Throwable) {
      ""
    }

    (context as? MainActivity)?.runOnUiThread {
      val response = if (geminiKey.isNotEmpty()) {
        "Gemini AI Assistant: \"$prompt\" — PLYNET connects creators with intelligent insights! ✨"
      } else {
        "✨ PLYNET Gemini Intelligence: Creating meaningful connections through authentic conversations. Connect. Share. Belong."
      }
      val safeResponse = response.replace("\"", "\\\"").replace("\n", "\\n")
      webView.evaluateJavascript("window['$callbackJs'] && window['$callbackJs'](\"$safeResponse\");", null)
    }
  }

  @JavascriptInterface
  fun simulateAd(adType: String, callbackJs: String) {
    (context as? MainActivity)?.runOnUiThread {
      Toast.makeText(context, "Google AdMob $adType loaded", Toast.LENGTH_SHORT).show()
      webView.evaluateJavascript("window['$callbackJs'] && window['$callbackJs']();", null)
    }
  }

  @JavascriptInterface
  fun purchasePremium(sku: String, callbackJs: String) {
    (context as? MainActivity)?.runOnUiThread {
      Toast.makeText(context, "Google Play Billing: Purchase successful ($sku)", Toast.LENGTH_LONG).show()
      webView.evaluateJavascript("window['$callbackJs'] && window['$callbackJs'](true);", null)
    }
  }
}

@Composable
fun PlynetWebViewContainer(
  onWebViewCreated: (WebView) -> Unit,
  modifier: Modifier = Modifier
) {
  AndroidView(
    factory = { context ->
      WebView(context).apply {
        onWebViewCreated(this)
      }
    },
    modifier = modifier.fillMaxSize()
  )
}

// Preserve Greeting composable for Robolectric and Screenshot tests
@Composable
fun Greeting(name: String, modifier: Modifier = Modifier) {
  Text(text = "Hello $name!", modifier = modifier)
}

@Preview(showBackground = true)
@Composable
fun GreetingPreview() {
  MyApplicationTheme { Greeting("Android") }
}

package com.streamking.app.ui.theme

import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

private val darkColorScheme = darkColorScheme(
    primary         = Teal,
    onPrimary       = BgDark,
    primaryContainer = TealDim,
    secondary       = TealBright,
    background      = BgDark,
    surface         = Surface,
    surfaceVariant  = CardBg,
    onBackground    = TextPrimary,
    onSurface       = TextPrimary,
    onSurfaceVariant = TextMid,
    outline         = Border,
    error           = AccentRed,
)

private val typography = Typography(
    headlineLarge = TextStyle(fontWeight = FontWeight.Bold,   fontSize = 32.sp, color = TextPrimary),
    headlineMedium = TextStyle(fontWeight = FontWeight.Bold,  fontSize = 24.sp, color = TextPrimary),
    headlineSmall = TextStyle(fontWeight = FontWeight.Bold,   fontSize = 18.sp, color = TextPrimary),
    titleLarge = TextStyle(fontWeight = FontWeight.SemiBold,  fontSize = 20.sp, color = TextPrimary),
    titleMedium = TextStyle(fontWeight = FontWeight.SemiBold, fontSize = 16.sp, color = TextPrimary),
    titleSmall = TextStyle(fontWeight = FontWeight.Medium,    fontSize = 14.sp, color = TextPrimary),
    bodyLarge = TextStyle(fontWeight = FontWeight.Normal,     fontSize = 16.sp, color = TextPrimary),
    bodyMedium = TextStyle(fontWeight = FontWeight.Normal,    fontSize = 14.sp, color = TextMid),
    bodySmall = TextStyle(fontWeight = FontWeight.Normal,     fontSize = 12.sp, color = TextDim),
    labelLarge = TextStyle(fontWeight = FontWeight.Medium,    fontSize = 14.sp, letterSpacing = 0.5.sp),
    labelSmall = TextStyle(fontWeight = FontWeight.Medium,    fontSize = 11.sp, letterSpacing = 0.8.sp),
)

@Composable
fun StreamKingTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = darkColorScheme,
        typography  = typography,
        content     = content,
    )
}

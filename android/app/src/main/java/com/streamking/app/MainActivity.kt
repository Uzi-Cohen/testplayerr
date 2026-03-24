package com.streamking.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavType
import androidx.navigation.compose.*
import androidx.navigation.navArgument
import com.streamking.app.ui.screen.*
import com.streamking.app.ui.theme.BgDark
import com.streamking.app.ui.theme.StreamKingTheme
import com.streamking.app.ui.theme.Teal

sealed class Screen(val route: String, val label: String, val icon: ImageVector) {
    object Home   : Screen("home",   "Home",     Icons.Filled.Home)
    object Movies : Screen("movies", "Movies",   Icons.Filled.Movie)
    object TV     : Screen("tv",     "TV Shows", Icons.Filled.Tv)
    object MyList : Screen("mylist", "My List",  Icons.Filled.Favorite)
    object Search : Screen("search", "Search",   Icons.Filled.Search)
}

private val NAV_ITEMS = listOf(
    Screen.Home, Screen.Movies, Screen.TV, Screen.MyList, Screen.Search,
)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            StreamKingTheme { StreamKingApp() }
        }
    }
}

@Composable
fun StreamKingApp() {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentDest = navBackStackEntry?.destination
    val hideBar = currentDest?.route?.startsWith("watch/") == true

    Scaffold(
        containerColor = BgDark,
        bottomBar = {
            if (!hideBar) {
                NavigationBar(containerColor = BgDark, tonalElevation = 0.dp) {
                    NAV_ITEMS.forEach { screen ->
                        val selected = currentDest?.hierarchy?.any { it.route == screen.route } == true
                        NavigationBarItem(
                            icon  = { Icon(screen.icon, contentDescription = screen.label) },
                            label = { Text(screen.label) },
                            selected = selected,
                            onClick = {
                                navController.navigate(screen.route) {
                                    popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                                    launchSingleTop = true
                                    restoreState    = true
                                }
                            },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor   = Teal,
                                selectedTextColor   = Teal,
                                indicatorColor      = BgDark,
                                unselectedIconColor = Color(0xFF686882),
                                unselectedTextColor = Color(0xFF686882),
                            ),
                        )
                    }
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController    = navController,
            startDestination = Screen.Home.route,
            modifier         = Modifier.padding(innerPadding),
        ) {
            composable(Screen.Home.route) {
                HomeScreen(onNavigateToWatch = { mt, id -> navController.navigate("watch/$mt/$id") })
            }
            composable(Screen.Movies.route) {
                BrowseScreen(isTv = false, onItemClick = { mt, id -> navController.navigate("watch/$mt/$id") })
            }
            composable(Screen.TV.route) {
                BrowseScreen(isTv = true, onItemClick = { mt, id -> navController.navigate("watch/$mt/$id") })
            }
            composable(Screen.MyList.route) {
                WatchlistScreen(onItemClick = { mt, id -> navController.navigate("watch/$mt/$id") })
            }
            composable(Screen.Search.route) {
                SearchScreen(onItemClick = { mt, id -> navController.navigate("watch/$mt/$id") })
            }
            composable(
                route = "watch/{mediaType}/{id}",
                arguments = listOf(
                    navArgument("mediaType") { type = NavType.StringType },
                    navArgument("id")        { type = NavType.IntType },
                ),
            ) { backStack ->
                val mediaType = backStack.arguments?.getString("mediaType") ?: "movie"
                val id        = backStack.arguments?.getInt("id") ?: 0
                WatchScreen(
                    mediaType    = mediaType,
                    id           = id,
                    onBack       = { navController.popBackStack() },
                    onNavigateTo = { mt, nid -> navController.navigate("watch/$mt/$nid") },
                )
            }
        }
    }
}

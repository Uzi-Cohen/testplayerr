package com.streamking.app.data.api

import com.streamking.app.BuildConfig
import com.streamking.app.data.model.*
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.Query

interface TmdbApi {

    // ── Trending ──────────────────────────────────────────────────────────────
    @GET("trending/all/week")
    suspend fun trending(): TmdbPage<MediaItem>

    // ── Movies ────────────────────────────────────────────────────────────────
    @GET("movie/popular")
    suspend fun popularMovies(@Query("page") page: Int = 1): TmdbPage<MediaItem>

    @GET("movie/top_rated")
    suspend fun topRatedMovies(@Query("page") page: Int = 1): TmdbPage<MediaItem>

    @GET("movie/now_playing")
    suspend fun nowPlayingMovies(@Query("page") page: Int = 1): TmdbPage<MediaItem>

    @GET("movie/{id}")
    suspend fun movieDetails(
        @Path("id") id: Int,
        @Query("append_to_response") append: String = "credits",
    ): MediaDetails

    @GET("movie/{id}/similar")
    suspend fun similarMovies(@Path("id") id: Int): TmdbPage<MediaItem>

    @GET("discover/movie")
    suspend fun discoverMovies(
        @Query("page")              page: Int = 1,
        @Query("with_genres")       genreId: Int? = null,
        @Query("sort_by")           sortBy: String = "popularity.desc",
        @Query("vote_average.gte")  minRating: Double = 0.0,
        @Query("vote_count.gte")    minVotes: Int = 0,
    ): TmdbPage<MediaItem>

    @GET("genre/movie/list")
    suspend fun genreMovies(): GenreList

    // ── TV ────────────────────────────────────────────────────────────────────
    @GET("tv/popular")
    suspend fun popularTV(@Query("page") page: Int = 1): TmdbPage<MediaItem>

    @GET("tv/top_rated")
    suspend fun topRatedTV(@Query("page") page: Int = 1): TmdbPage<MediaItem>

    @GET("tv/on_the_air")
    suspend fun airingTV(@Query("page") page: Int = 1): TmdbPage<MediaItem>

    @GET("tv/{id}")
    suspend fun tvDetails(
        @Path("id") id: Int,
        @Query("append_to_response") append: String = "credits",
    ): MediaDetails

    @GET("tv/{id}/season/{season}")
    suspend fun tvSeason(
        @Path("id") id: Int,
        @Path("season") season: Int,
    ): SeasonDetails

    @GET("tv/{id}/similar")
    suspend fun similarTV(@Path("id") id: Int): TmdbPage<MediaItem>

    @GET("discover/tv")
    suspend fun discoverTV(
        @Query("page")              page: Int = 1,
        @Query("with_genres")       genreId: Int? = null,
        @Query("sort_by")           sortBy: String = "popularity.desc",
        @Query("vote_average.gte")  minRating: Double = 0.0,
        @Query("vote_count.gte")    minVotes: Int = 0,
    ): TmdbPage<MediaItem>

    @GET("genre/tv/list")
    suspend fun genreTV(): GenreList

    // ── Search ────────────────────────────────────────────────────────────────
    @GET("search/multi")
    suspend fun search(
        @Query("query") query: String,
        @Query("page")  page: Int = 1,
    ): TmdbPage<MediaItem>
}

// ── Singleton client ──────────────────────────────────────────────────────────

object TmdbClient {
    private const val BASE_URL = "https://api.themoviedb.org/3/"

    val api: TmdbApi by lazy {
        val logging = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.NONE
        }
        val client = OkHttpClient.Builder()
            .addInterceptor(logging)
            .addInterceptor { chain ->
                val req = chain.request().newBuilder()
                    .addHeader("Authorization", "Bearer ${BuildConfig.TMDB_TOKEN}")
                    .addHeader("accept", "application/json")
                    .build()
                chain.proceed(req)
            }
            .build()

        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(TmdbApi::class.java)
    }
}

import express from "express";
import cors from "cors";
import axios from "axios";

const RADIOFM_API_BASE = "https://dramasstory.com/drama/";
const port = process.env.PORT || 3000;

// Interfaces
interface RadioStation {
    st_id: string;
    st_name: string;
    st_logo: string;
    st_weburl: string;
    st_shorturl: string;
    st_genre: string;
    st_lang: string;
    language: string;
    st_bc_freq: string;
    st_city: string;
    st_state: string;
    country_name_rs: string;
    st_country: string;
    st_play_cnt: string;
    st_fav_cnt: string;
    stream_link: string;
    stream_type: string;
    stream_bitrate: string;
    deeplink: string;
}

interface Podcast {
    p_id: string;
    p_name: string;
    p_desc: string;
    p_lang: string;
    p_image: string;
    p_email: string;
    cat_name: string;
    total_stream: string;
    deeplink: string;
    cc_code: string;
}

interface Drama {
    id: string;
    drama_name: string;
    d_keywords: string;
    total_episodes: string;
    d_desc: string;
    slug: string;
    image_url: string;
    gradient: string;
    unlock_epi_count: string;
    status: string;
    added_dt: string;
}

interface ApiResponse {
    http_response_code: number;
    http_response_message: string;
    data: {
        ErrorCode: number;
        ErrorMessage: string;
        Data: Array<{
            type: string;
            data: RadioStation[] | Podcast[] | Drama[];
        }>;
    };
}

// Format radio station details
function formatRadioStation(station: RadioStation, index: number): string {
    const lines = [
        `${index}. ${station.st_name}`,
        `Location: ${station.st_city}, ${station.st_state}, ${station.country_name_rs}`,
        `Language: ${station.language}`,
        `Genre: ${station.st_genre}`,
    ];

    if (station.st_bc_freq !== "~") lines.push(`Frequency: ${station.st_bc_freq}`);

    lines.push(
        `Stream: ${station.stream_type} ${station.stream_bitrate}kbps`,
        `Plays: ${parseInt(station.st_play_cnt).toLocaleString()}`,
        `Listen: https://dramasstory.com/radioplay/${station.st_shorturl}`
    );

    return lines.join("\n");
}

// Format podcast details
function formatPodcast(podcast: Podcast, index: number): string {
    const lines = [
        `${index}. ${podcast.p_name}`,
        `Category: ${podcast.cat_name}`,
        `Language: ${podcast.p_lang}`,
    ];

    if (podcast.p_desc) {
        const shortDesc =
            podcast.p_desc.length > 100
                ? podcast.p_desc.substring(0, 100) + "..."
                : podcast.p_desc;
        lines.push(`Description: ${shortDesc}`);
    }

    lines.push(
        `Streams: ${parseInt(podcast.total_stream).toLocaleString()}`,
        `Listen: ${podcast.deeplink}`
    );

    return lines.join("\n");
}

// Format drama details
function formatDrama(drama: Drama, index: number): string {
    const lines = [
        `${index}. ${drama.drama_name}`,
        `Episodes: ${drama.total_episodes}`,
        `Keywords: ${drama.d_keywords}`,
    ];

    if (drama.d_desc) {
        const shortDesc =
            drama.d_desc.length > 100
                ? drama.d_desc.substring(0, 100) + "..."
                : drama.d_desc;
        lines.push(`Description: ${shortDesc}`);
    }

    lines.push(
        `Image: ${drama.image_url}`,
        `Listen: https://dramasstory.com/drama/${drama.slug}-${drama.id}?episode=0`
    );

    return lines.join("\n");
}

// Express setup
const app = express();
app.use(cors());
app.use(express.json());

// Handle preflight
// app.options("/.*/", cors());

// Health check
app.get("/", (_req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.json({
        status: "Dramaflicks MCP Server is running",
        version: "1.0.1",
        protocol: "MCP",
    });
});

app.get("/mcp", (_req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.json({
        message: "Dramaflicks MCP endpoint – use POST with ChatGPT MCP protocol."
    });
});

// OpenAI Apps Challenge verification
app.get("/.well-known/openai-apps-challenge", (_req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "text/plain");
    res.send("9-BRtIuK2ZXZVF19OJx1Gp5qKgrfzE4ekkeHUYFN_68");
});


// MCP descriptor (for ChatGPT Apps & Connectors)
app.get("/mcp.json", (_req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.json({
        schema_version: "v1",
        name: "Dramaflicks",
        version: "1.0.1",
        description:
            "Radio FM brings the world’s radio stations, podcasts, and dramas directly into ChatGPT. Explore live broadcasts from over 200 countries and discover gripping dramas — search by station name, city, country, language, genre, or drama title, and instantly discover music, news, talk, sports channels, and thrilling audio stories that suit your mood. Whether you want trending hits, sports or regional talk shows, local community radio, or immersive dramas, ChatGPT can use Radio FM to find and play them in real time. No authentication or setup is required — just search and start listening.",
        api: {
            type: "mcp",
            url: "https://dramaflicks.vercel.app/mcp",
        },
        auth: "none",
        capabilities: {
            tools: [
                {
                    name: "search_dramas",
                    description:
                        "Search and discover live radio stations, podcasts, and dramas from across the world by entering a station name, location, country, language, genre, or drama title. ChatGPT connects with the Radio FM database to instantly return matching stations, podcasts, and dramas you can explore or play — from local favorites to trending global broadcasts and gripping audio stories.",
                    inputSchema: {
                        type: "object",
                        properties: {
                            query: {
                                type: "string",
                                description:
                                    "Search query (e.g., 'BBC', 'India', 'Hindi', 'Jazz')",
                            },
                        },
                        required: ["query"],
                    },
                    "annotations": {
                        "readOnlyHint": true,
                        "openWorldHint": true,
                        "destructiveHint": false
                    },
                    // "auto_execute": true
                },
            ],
        },
        categories: ["drama", "thriller", "media", "entertainment", "music"],
        author: {
            name: "Dramaflicks",
            website: "https://dramasstory.com/terms-of-use",
            email: "support@dramasstory.com",
        },
        icon: {
            url: "https://dramaflicks-mcp-flame.vercel.app/UpdatedRFMIcon.png",
            background: "#111827",
        },
        legal: {
            privacy_policy_url: "https://dramasstory.com/privacy-policy",
            terms_of_service_url: "https://dramasstory.com/terms-of-use",
        },
        homepage: "https://dramasstory.com/",
        license: "MIT",
    });
});

// MCP protocol handler
app.post("/mcp", async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/json");

    try {
        const { method, params, id } = req.body;

        // Initialize handshake
        if (method === "initialize") {
            return res.json({
                jsonrpc: "2.0",
                id,
                result: {
                    protocolVersion: "2024-11-05",
                    capabilities: { tools: {} },
                    serverInfo: { name: "dramaflicks-mcp", version: "1.0.1" },
                },
            });
        }

        // List tools
        if (method === "tools/list") {
            return res.json({
                jsonrpc: "2.0",
                id,
                result: {
                    tools: [
                        {
                            name: "search_dramas",
                            description:
                                "Search and explore live radio stations, podcasts, and dramas from around the world using the Radio FM app within ChatGPT. Discover trending music, news, cultural broadcasts, and gripping audio dramas across languages, genres, and countries — all seamlessly accessible without sign-in.",
                            inputSchema: {
                                type: "object",
                                properties: {
                                    query: {
                                        type: "string",
                                        description:
                                            "Search query (e.g., 'BBC', 'India', 'Hindi', 'Jazz')",
                                    },
                                },
                                required: ["query"],
                            },
                            "annotations": {
                                "readOnlyHint": true,
                                "openWorldHint": true,
                                "destructiveHint": false
                            }
                        },
                    ],
                },
            });
        }

        // Tool call
        if (method === "tools/call") {
            const { name, arguments: args } = params;
            if (name !== "search_dramas")
                throw new Error(`Unknown tool: ${name}`);

            const query = args?.query as string;
            if (!query) throw new Error("Search query is required");

            const response = await axios.get<ApiResponse>(
                `${RADIOFM_API_BASE}/new_combo_search.php`,
                { params: { srch: query }, timeout: 15000 }
            );
            const apiData = response.data;
            if (apiData.data.ErrorCode !== 0)
                throw new Error(apiData.data.ErrorMessage);

            const results = apiData.data.Data;
            if (!results?.length)
                return res.json({
                    jsonrpc: "2.0",
                    id,
                    result: {
                        content: [
                            {
                                type: "text",
                                text: `🔍 No results found for "${query}". Try station name, country, language, or genre.`,
                            },
                        ],
                    },
                });

            const sections = [`Search Results for "${query}"`];
            const radioData = results.find((r) => r.type === "radio");
            if (radioData && radioData.data.length > 0) {
                const stations = radioData.data as RadioStation[];
                sections.push(
                    `\nRADIO STATIONS (${stations.length})`,
                    ...stations.map((station, i) => formatRadioStation(station, i + 1))
                );
            }

            const podcastData = results.find((r) => r.type === "podcast");
            if (podcastData && podcastData.data.length > 0) {
                const podcasts = podcastData.data as Podcast[];
                sections.push(
                    `\nPODCASTS (${podcasts.length})`,
                    ...podcasts.map((podcast, i) => formatPodcast(podcast, i + 1))
                );
            }

            const dramaData = results.find((r) => r.type === "dramas");
            if (dramaData && dramaData.data.length > 0) {
                const dramas = dramaData.data as unknown as Drama[];
                sections.push(
                    `\nDRAMAS (${dramas.length})`,
                    ...dramas.map((drama, i) => formatDrama(drama, i + 1))
                );
            }

            sections.push("\nTap on any 'Listen' link to play on Dramaflicks.");
            return res.json({
                jsonrpc: "2.0",
                id,
                result: {
                    content: [{ type: "text", text: sections.join("\n") }],
                },
            });
        }

        throw new Error(`Unknown method: ${method}`);
    } catch (err: any) {
        console.error("MCP Error:", err);
        res.json({
            jsonrpc: "2.0",
            id: req.body?.id || null,
            error: { code: -32000, message: err.message || "Internal server error" },
        });
    }
});

// Start server
app.listen(port, () => {
    console.log(`✅ Dramaflicks MCP Server running on http://localhost:${port}`);
    console.log(`📡 MCP descriptor: /mcp.json`);
});



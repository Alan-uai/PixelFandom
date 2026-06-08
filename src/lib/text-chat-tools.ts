import { supabase } from '@/supabase';
import { searchAll, type SearchAllResult } from '@/lib/search';
import { getGameSchema, getTableSchema, type ColumnInfo } from '@/lib/game-schema';
import { evaluateMath, type MathResult } from '@/lib/math-tools';

export interface ToolContext {
  slug: string;
  tenantId: string | null;
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, unknown>;
      required?: string[];
    };
  };
}

// ── Existing tools ──

const searchWikiDef: ToolDefinition = {
  type: 'function',
  function: {
    name: 'searchWiki',
    description: `Search ALL wiki + game data (weapons, armors, enemies, bosses, rings, potions, upgrades). Returns wiki articles and game_items with stats. This is the PRIMARY search tool — use it for finding specific items, enemies, or articles by name. Do NOT search with the user's full question; extract only key terms (e.g., "espada noturna" not "como obter a espada noturna").`,
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Extracted key search term (lowercase, hyphenated optional). NOT the full user question.' },
      },
      required: ['query'],
    },
  },
};

const getWikiInfoDef: ToolDefinition = {
  type: 'function',
  function: {
    name: 'getWikiInfo',
    description: 'Get wiki metadata: total article count, per-tag counts (tag_counts like { potions: 4, weapons: 30 }), and all tags. Use for answering "how many articles", "quantas poções existem", "what categories exist". NEVER invent counts — read the actual numbers from the response.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
};

const getWikiArticleDef: ToolDefinition = {
  type: 'function',
  function: {
    name: 'getWikiArticle',
    description: 'Get the full content of a wiki article by its slug. Also returns item_stats with raw attributes IF the article has structured game data. PREFER searchWiki for finding items — getWikiArticle is only for reading full article text after you have the slug.',
    parameters: {
      type: 'object',
      properties: {
        slug: { type: 'string', description: 'The article slug (e.g. "steel-sword", "goblin-king"). Use the slug returned by searchWiki.' },
      },
      required: ['slug'],
    },
  },
};

const listWikiArticlesDef: ToolDefinition = {
  type: 'function',
  function: {
    name: 'listWikiArticles',
    description: 'Browse articles by category using the optional "tag" parameter (e.g. "potions", "weapons", "armors", "rings", "enemies", "bosses", "upgrades"). Returns article titles, slugs, and summaries for browsing. For FINDING a specific item by name, use searchWiki instead — this tool only lists by tag.',
    parameters: {
      type: 'object',
      properties: {
        tag: { type: 'string', description: 'Optional: filter by tag/category (e.g. "potions", "weapons"). Without this, lists ALL articles.' },
      },
    },
  },
};

// ── New schema tools ──

const listGameTablesDef: ToolDefinition = {
  type: 'function',
  function: {
    name: 'listGameTables',
    description: 'List all game data tables (weapons, armors, enemies, bosses, rings, potions, upgrades, worlds, codes, etc.) with their display labels and approximate item counts. Use to discover what data is available before querying.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
};

const getTableSchemaDef: ToolDefinition = {
  type: 'function',
  function: {
    name: 'getTableSchema',
    description: 'Get column names, types, and metadata for any game table. Returns all available columns so you know what filters/stats you can query. Use before querying a table to understand its structure.',
    parameters: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'The table name (e.g. "weapons", "enemies", "armors")' },
      },
      required: ['table'],
    },
  },
};

const findColumnsDef: ToolDefinition = {
  type: 'function',
  function: {
    name: 'findColumns',
    description: 'Search for columns matching a term across all game tables. Useful when you need to find which tables have a specific stat like "damage", "crit", or "speed". Returns table name, column name, and data type for each match.',
    parameters: {
      type: 'object',
      properties: {
        term: { type: 'string', description: 'The column name term to search for (e.g. "damage", "crit", "speed", "price")' },
      },
      required: ['term'],
    },
  },
};

// ── New item query tools ──

const getItemDef: ToolDefinition = {
  type: 'function',
  function: {
    name: 'getItem',
    description: 'Get a single item by name from any game table. Returns ALL columns/attributes for that item. Use when you know the exact item name and want its full data. Use searchWiki first if you do not know the exact name or table.',
    parameters: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'The table name (e.g. "weapons", "enemies")' },
        name: { type: 'string', description: 'The item name to look up (case-insensitive, partial match supported)' },
      },
      required: ['table', 'name'],
    },
  },
};

const queryItemsDef: ToolDefinition = {
  type: 'function',
  function: {
    name: 'queryItems',
    description: 'Query items in any table with flexible column filters. Use for complex queries like "find weapons with fire element" or "list armors with tier S". Supports multiple filter conditions. Returns matching items with all their attributes.',
    parameters: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'The table name (e.g. "weapons", "armors")' },
        filters: {
          type: 'object',
          description: 'Key-value pairs of column to filter by. Example: {"element": "fire", "rarity": "legendary"}',
          additionalProperties: { type: 'string' },
        },
        limit: { type: 'number', description: 'Maximum items to return (default 20, max 100)' },
      },
      required: ['table', 'filters'],
    },
  },
};

const filterByRangeDef: ToolDefinition = {
  type: 'function',
  function: {
    name: 'filterByRange',
    description: 'Find items in a table where a numeric column falls within a specified range. Use for questions like "weapons with damage above 50" or "items costing less than 100 gold".',
    parameters: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'The table name (e.g. "weapons", "potions")' },
        column: { type: 'string', description: 'The numeric column to filter by (e.g. "damage_min", "shop_price")' },
        min: { type: 'number', description: 'Minimum value (inclusive). Omit for no lower bound.' },
        max: { type: 'number', description: 'Maximum value (inclusive). Omit for no upper bound.' },
        limit: { type: 'number', description: 'Maximum items to return (default 20, max 100)' },
      },
      required: ['table', 'column'],
    },
  },
};

const searchTableDef: ToolDefinition = {
  type: 'function',
  function: {
    name: 'searchTable',
    description: 'Full-text search within a single game table. Use when you know which table to search but want to find items matching a word in any of their text fields. For cross-table search, use searchWiki instead.',
    parameters: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'The table name (e.g. "weapons", "enemies")' },
        term: { type: 'string', description: 'The search term to look for in text columns' },
        limit: { type: 'number', description: 'Maximum items to return (default 20, max 50)' },
      },
      required: ['table', 'term'],
    },
  },
};

const countItemsDef: ToolDefinition = {
  type: 'function',
  function: {
    name: 'countItems',
    description: 'Count items in a table matching optional filter conditions. Use for questions like "how many legendary weapons exist" or "how many enemies have more than 100 HP". Returns the count only — for item details use queryItems.',
    parameters: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'The table name (e.g. "weapons", "enemies")' },
        column: { type: 'string', description: 'Optional column to filter on' },
        value: { type: 'string', description: 'Optional value to match (used with column)' },
      },
      required: ['table'],
    },
  },
};

const listItemsDef: ToolDefinition = {
  type: 'function',
  function: {
    name: 'listItems',
    description: 'Browse/paginate through items in a table showing their name, slug, and key attributes. Use for browsing all items when you do not need full details. For detailed stats on specific items, use getItem instead.',
    parameters: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'The table name (e.g. "weapons", "potions")' },
        offset: { type: 'number', description: 'Number of items to skip (default 0)' },
        limit: { type: 'number', description: 'Maximum items to return (default 20, max 100)' },
        sortBy: { type: 'string', description: 'Optional column to sort by' },
        sortDir: { type: 'string', enum: ['asc', 'desc'], description: 'Sort direction (default "asc")' },
      },
      required: ['table'],
    },
  },
};

// ── New stat analysis tools ──

const rankByStatDef: ToolDefinition = {
  type: 'function',
  function: {
    name: 'rankByStat',
    description: 'Get the ranking position of a specific item by a numeric stat within its table. Use for questions like "what is the rank of steel sword by damage" or "which position does fire ring hold by price".',
    parameters: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'The table name (e.g. "weapons", "armors")' },
        stat: { type: 'string', description: 'The numeric column name to rank by (e.g. "damage_min", "shop_price")' },
        itemName: { type: 'string', description: 'The name of the item to find the rank for' },
      },
      required: ['table', 'stat', 'itemName'],
    },
  },
};

const compareOnStatDef: ToolDefinition = {
  type: 'function',
  function: {
    name: 'compareOnStat',
    description: 'Sort and compare all items in a table by a numeric stat. Returns items ordered from highest to lowest with their stat values. Use for questions like "which weapon has the most damage" or "show me all armors sorted by HP bonus".',
    parameters: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'The table name (e.g. "weapons", "potions")' },
        stat: { type: 'string', description: 'The numeric column to compare by' },
        limit: { type: 'number', description: 'Maximum items to return (default 10, max 50)' },
        descending: { type: 'boolean', description: 'Sort highest first (default true). Set false for lowest first.' },
      },
      required: ['table', 'stat'],
    },
  },
};

const getStatSummaryDef: ToolDefinition = {
  type: 'function',
  function: {
    name: 'getStatSummary',
    description: 'Get summary statistics (minimum, maximum, average, item count) for a numeric column across a table. Use for questions like "what is the average damage of all weapons" or "what is the price range for potions".',
    parameters: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'The table name (e.g. "weapons", "armors")' },
        column: { type: 'string', description: 'The numeric column to summarize (e.g. "damage_min", "shop_price")' },
      },
      required: ['table', 'column'],
    },
  },
};

const getTopItemsDef: ToolDefinition = {
  type: 'function',
  function: {
    name: 'getTopItems',
    description: 'Get the top N items in a table by a numeric stat. Use for questions like "top 5 strongest weapons" or "the 3 most expensive items in the shop".',
    parameters: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'The table name (e.g. "weapons", "potions")' },
        stat: { type: 'string', description: 'The numeric column to rank by (e.g. "damage_min", "shop_price")' },
        limit: { type: 'number', description: 'Number of items to return (default 5, max 20)' },
      },
      required: ['table', 'stat'],
    },
  },
};

const getCategoryAveragesDef: ToolDefinition = {
  type: 'function',
  function: {
    name: 'getCategoryAverages',
    description: 'Get average values of numeric stats grouped by a category column. Use for questions like "average damage per weapon type" or "average price by rarity tier".',
    parameters: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'The table name (e.g. "weapons", "enemies")' },
        categoryColumn: { type: 'string', description: 'The column to group by (e.g. "weapon_type", "rarity", "element", "tier")' },
        statColumns: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of numeric column names to average. If empty, averages all numeric columns.',
        },
      },
      required: ['table', 'categoryColumn'],
    },
  },
};

const getStatDistributionDef: ToolDefinition = {
  type: 'function',
  function: {
    name: 'getStatDistribution',
    description: 'Get the distribution of values for a column showing how many items have each distinct value. Use for questions like "how many items of each rarity exist" or "element distribution among weapons". Works for both text and numeric columns.',
    parameters: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'The table name' },
        column: { type: 'string', description: 'The column to get distribution for (e.g. "rarity", "element", "weapon_type")' },
      },
      required: ['table', 'column'],
    },
  },
};

// ── Cross-reference tools ──

const compareTwoItemsDef: ToolDefinition = {
  type: 'function',
  function: {
    name: 'compareTwoItems',
    description: 'Side-by-side comparison of two items, showing all their numeric stats in a comparison table. Use for questions like "compare steel sword with iron sword" or "which is better between ring A and ring B". Items can be from different tables.',
    parameters: {
      type: 'object',
      properties: {
        tableA: { type: 'string', description: 'Table of the first item' },
        nameA: { type: 'string', description: 'Name of the first item' },
        tableB: { type: 'string', description: 'Table of the second item' },
        nameB: { type: 'string', description: 'Name of the second item' },
      },
      required: ['tableA', 'nameA', 'tableB', 'nameB'],
    },
  },
};

const findSimilarItemsDef: ToolDefinition = {
  type: 'function',
  function: {
    name: 'findSimilarItems',
    description: 'Find items with similar numeric stat profiles to a given item. Useful for discovering alternatives or replacements. Compares all numeric columns and returns items with closest stat values.',
    parameters: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'The table name' },
        itemName: { type: 'string', description: 'The name of the item to find similar items for' },
        limit: { type: 'number', description: 'Number of similar items to return (default 5, max 20)' },
      },
      required: ['table', 'itemName'],
    },
  },
};

const searchAllTablesDef: ToolDefinition = {
  type: 'function',
  function: {
    name: 'searchAllTables',
    description: 'Search for an item name or partial name across ALL game tables simultaneously. Returns which table each match was found in, plus the matching item name. Use when you are not sure which table contains an item. More targeted than searchWiki — this only matches the name field.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'The item name or partial name to search for across all tables' },
      },
      required: ['name'],
    },
  },
};

const findByCategoryDef: ToolDefinition = {
  type: 'function',
  function: {
    name: 'findByCategory',
    description: 'Get all items in a table that share a specific value in a category column. Use for questions like "list all fire element weapons" or "find all S tier armors" or "get all enemies in the forest world".',
    parameters: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'The table name' },
        column: { type: 'string', description: 'The category column to filter by (e.g. "element", "rarity", "tier", "weapon_type", "world_name")' },
        value: { type: 'string', description: 'The value to match (e.g. "fire", "legendary", "S")' },
        limit: { type: 'number', description: 'Maximum items to return (default 50, max 200)' },
      },
      required: ['table', 'column', 'value'],
    },
  },
};

// ── Analysis tools ──

const getTableComparisonDef: ToolDefinition = {
  type: 'function',
  function: {
    name: 'getTableComparison',
    description: 'Compare stat distributions between two different tables. Shows how numeric columns compare (avg, min, max) between tables like weapons vs armors. Use for questions about how different item categories compare statistically.',
    parameters: {
      type: 'object',
      properties: {
        tableA: { type: 'string', description: 'First table name' },
        tableB: { type: 'string', description: 'Second table name' },
        stat: { type: 'string', description: 'The numeric column to compare across tables' },
      },
      required: ['tableA', 'tableB', 'stat'],
    },
  },
};

const getItemNeighborsDef: ToolDefinition = {
  type: 'function',
  function: {
    name: 'getItemNeighbors',
    description: 'Find items whose numeric stats are within a percentage range of a given item. Useful for finding gear at similar power levels or budget-friendly alternatives. Shows items slightly worse and slightly better.',
    parameters: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'The table name' },
        itemName: { type: 'string', description: 'Name of the reference item' },
        stat: { type: 'string', description: 'The numeric column to compare on' },
        percentRange: { type: 'number', description: 'Percentage range to consider "neighbor" (default 20, meaning ±20%)' },
        limit: { type: 'number', description: 'Maximum neighbors to return each side (default 3)' },
      },
      required: ['table', 'itemName', 'stat'],
    },
  },
};

const findUpgradesDef: ToolDefinition = {
  type: 'function',
  function: {
    name: 'findUpgrades',
    description: 'Find items in a table that are strictly better than a given item in at least one specified stat, and not worse in any compared stat. Use for upgrade recommendations like "what is better than steel sword in damage".',
    parameters: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'The table name' },
        itemName: { type: 'string', description: 'Name of the item to find upgrades for' },
        stats: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of numeric column names to compare. Items must not be worse in any of these.',
        },
        limit: { type: 'number', description: 'Maximum items to return (default 10, max 30)' },
      },
      required: ['table', 'itemName', 'stats'],
    },
  },
};

const getStatTrendDef: ToolDefinition = {
  type: 'function',
  function: {
    name: 'getStatTrend',
    description: 'Analyze how a stat correlates with another stat across all items in a table. Returns the Pearson correlation coefficient and a summary. Use for questions like "do higher damage weapons also cost more" or "is there a relationship between speed and knockback".',
    parameters: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'The table name' },
        statA: { type: 'string', description: 'First numeric column' },
        statB: { type: 'string', description: 'Second numeric column' },
      },
      required: ['table', 'statA', 'statB'],
    },
  },
};

// ── Wiki tools ──

const getWikiTagsDef: ToolDefinition = {
  type: 'function',
  function: {
    name: 'getWikiTags',
    description: 'Get all wiki tags with their article counts. Returns tag names and how many articles use each tag. Use for questions like "what categories exist" or "which category has the most articles".',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
};

const searchWikiPagesDef: ToolDefinition = {
  type: 'function',
  function: {
    name: 'searchWikiPages',
    description: 'Search wiki page titles and summaries by text. Returns matching page slugs, titles, and summaries. Use for finding wiki pages about a topic. For finding game items with stats, use searchWiki instead.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Text to search for in page titles and summaries' },
        limit: { type: 'number', description: 'Maximum results (default 10, max 30)' },
      },
      required: ['query'],
    },
  },
};

const listPagesByTagDef: ToolDefinition = {
  type: 'function',
  function: {
    name: 'listPagesByTag',
    description: 'List wiki pages by tag/category. Returns page titles, slugs, and summaries. Use for browsing content by category. For game items, use listItems instead.',
    parameters: {
      type: 'object',
      properties: {
        tag: { type: 'string', description: 'The tag/category to filter by (e.g. "weapons", "potions", "guides"). Lists ALL if omitted.' },
        limit: { type: 'number', description: 'Maximum results (default 20, max 50)' },
      },
    },
  },
};

const getRecentPagesDef: ToolDefinition = {
  type: 'function',
  function: {
    name: 'getRecentPages',
    description: 'Get recently created or updated wiki pages. Use for questions about what is new or what has changed recently in the wiki. Returns page slugs, titles, and update timestamps.',
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Maximum pages to return (default 10, max 30)' },
        days: { type: 'number', description: 'How many days back to look (default 30). Set to 0 for all time.' },
      },
    },
  },
};

// ── New tools ──

const evaluateMathDef: ToolDefinition = {
  type: 'function',
  function: {
    name: 'evaluateMath',
    description: 'Evaluate mathematical expressions (arithmetic, trigonometry, logarithms, etc.). Use for any calculation: percentages, averages, formulas, conversions, stat comparisons. Example: "(80-50)/50*100" for percent difference, "15% of 230", "sqrt(144)", "sin(45 deg)".',
    parameters: {
      type: 'object',
      properties: {
        expression: { type: 'string', description: 'The math expression to evaluate (e.g. "(80-50)/50*100", "sqrt(144)", "15/100*230", "sin(45 deg)")' },
        precision: { type: 'number', description: 'Decimal places for result (default 4)' },
      },
      required: ['expression'],
    },
  },
};

const batchWikiSearchDef: ToolDefinition = {
  type: 'function',
  function: {
    name: 'batchWikiSearch',
    description: 'Search for MULTIPLE wiki item terms in ONE call. Runs parallel searches for each term and returns combined results. Use when the user mentions several items at once (e.g., "compare steel sword, iron sword, and battle axe") or asks about multiple unrelated things in one question.',
    parameters: {
      type: 'object',
      properties: {
        queries: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of search terms to look up in parallel (e.g. ["steel sword", "iron sword", "battle axe"]). Max 10 terms.',
        },
      },
      required: ['queries'],
    },
  },
};

const searchByExampleDef: ToolDefinition = {
  type: 'function',
  function: {
    name: 'searchByExample',
    description: 'Find items with similar stat profiles to a given item. Unlike findSimilarItems, this lets you control which columns matter and their weights. Use for precise searches like "find weapons with similar damage AND speed to my sword" or "which armors match this one in defense and weight?".',
    parameters: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'The table name (e.g. "weapons", "armors")' },
        itemName: { type: 'string', description: 'The reference item name' },
        matchColumns: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific columns to compare. If omitted, uses ALL numeric columns.',
        },
        limit: { type: 'number', description: 'Maximum similar items to return (default 5, max 20)' },
      },
      required: ['table', 'itemName'],
    },
  },
};

const formatAsTableDef: ToolDefinition = {
  type: 'function',
  function: {
    name: 'formatAsTable',
    description: 'Fetch data from a table and format it as a clean markdown table. Specify which items and columns to include. Use when you want a neatly formatted table of items and their stats for the user to read.',
    parameters: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'The table name (e.g. "weapons", "armors")' },
        columns: {
          type: 'array',
          items: { type: 'string' },
          description: 'Which columns to include in the table (e.g. ["name", "damage_min", "speed", "shop_price"]). If omitted, includes name + all numeric columns.',
        },
        itemNames: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific items to include (by name). If omitted, shows all items in table up to limit.',
        },
        sortBy: { type: 'string', description: 'Optional column to sort by' },
        sortDir: { type: 'string', enum: ['asc', 'desc'], description: 'Sort direction (default "asc")' },
        limit: { type: 'number', description: 'Max items (default 20, max 50). Only used if itemNames is empty.' },
      },
      required: ['table'],
    },
  },
};

const getRecentItemsDef: ToolDefinition = {
  type: 'function',
  function: {
    name: 'getRecentItems',
    description: 'Get recently added game items across ALL game tables. Shows what items were added recently to weapons, armors, enemies, etc. Use for "what is new", "quais itens foram adicionados", "what changed in the game data lately?".',
    parameters: {
      type: 'object',
      properties: {
        days: { type: 'number', description: 'How many days back to look (default 7). Set to 0 for all time.' },
        limit: { type: 'number', description: 'Max items per table (default 5, max 20)' },
      },
    },
  },
};

const getRelatedItemsDef: ToolDefinition = {
  type: 'function',
  function: {
    name: 'getRelatedItems',
    description: 'Discover items in other tables that are connected to a given item. Uses column naming conventions to find relationships (e.g., a "weapon_id" column in enemies table means that enemy is related to the weapon). Use for questions like "what enemies drop this weapon?" or "which recipes use this item?".',
    parameters: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'The item\'s table (e.g. "weapons", "armors")' },
        itemName: { type: 'string', description: 'The item name to find relations for' },
      },
      required: ['table', 'itemName'],
    },
  },
};

const multiTableQueryDef: ToolDefinition = {
  type: 'function',
  function: {
    name: 'multiTableQuery',
    description: 'Query the same filter across MULTIPLE tables in one call. Returns results grouped by table. Use for cross-category questions like "find me all items with fire element" (checks weapons + armors + rings) or "what items cost less than 100 gold across all shops?".',
    parameters: {
      type: 'object',
      properties: {
        tables: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of table names to query (e.g. ["weapons", "armors", "rings"]). Max 5 tables.',
        },
        filters: {
          type: 'object',
          description: 'Key-value pairs of column filters (e.g. {"element": "fire"} or {"rarity": "legendary"})',
          additionalProperties: { type: 'string' },
        },
        limit: { type: 'number', description: 'Max items per table (default 10, max 30)' },
      },
      required: ['tables', 'filters'],
    },
  },
};

const batchGetItemsDef: ToolDefinition = {
  type: 'function',
  function: {
    name: 'batchGetItems',
    description: 'Get MULTIPLE items from a table by name or slug in ONE call. Much faster than calling getItem repeatedly. Use when the user asks about several specific items (e.g., "tell me about steel sword, iron sword, and void blade").',
    parameters: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'The table name (e.g. "weapons", "armors")' },
        names: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of item names or slugs to fetch (e.g. ["steel-sword", "iron-sword", "void-blade"]). Max 10 items.',
        },
      },
      required: ['table', 'names'],
    },
  },
};

export const TEXT_CHAT_TOOLS: ToolDefinition[] = [
  searchWikiDef,
  getWikiInfoDef,
  getWikiArticleDef,
  listWikiArticlesDef,
  listGameTablesDef,
  getTableSchemaDef,
  findColumnsDef,
  getItemDef,
  queryItemsDef,
  filterByRangeDef,
  searchTableDef,
  countItemsDef,
  listItemsDef,
  rankByStatDef,
  compareOnStatDef,
  getStatSummaryDef,
  getTopItemsDef,
  getCategoryAveragesDef,
  getStatDistributionDef,
  compareTwoItemsDef,
  findSimilarItemsDef,
  searchAllTablesDef,
  findByCategoryDef,
  getTableComparisonDef,
  getItemNeighborsDef,
  findUpgradesDef,
  getStatTrendDef,
  getWikiTagsDef,
  searchWikiPagesDef,
  listPagesByTagDef,
  getRecentPagesDef,
  evaluateMathDef,
  batchWikiSearchDef,
  searchByExampleDef,
  formatAsTableDef,
  getRecentItemsDef,
  getRelatedItemsDef,
  multiTableQueryDef,
  batchGetItemsDef,
];

// ── Helper: get tenant by slug or id ──

async function getTenantBySlugOrId(slug: string, tenantId: string | null): Promise<{ id: string; name: string; slug: string; logo_url: string | null; description: string | null } | null> {
  if (tenantId) {
    const { data } = await supabase
      .from('tenants')
      .select('id, name, slug, logo_url, description')
      .eq('id', tenantId)
      .single();
    return data as { id: string; name: string; slug: string; logo_url: string | null; description: string | null } | null;
  }
  if (slug) {
    const { data } = await supabase
      .from('tenants')
      .select('id, name, slug, logo_url, description')
      .eq('slug', slug)
      .single();
    return data as { id: string; name: string; slug: string; logo_url: string | null; description: string | null } | null;
  }
  return null;
}

function parseContentToJson(content: string | null): Record<string, unknown> | null {
  if (!content) return null;
  try {
    const parsed = JSON.parse(content);
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

// ── Handler implementations ──

async function handleSearchWiki(args: { query: string }, ctx: ToolContext): Promise<SearchAllResult> {
  return searchAll(ctx.slug, args.query);
}

async function handleGetWikiInfo(_args: Record<string, never>, ctx: ToolContext): Promise<Record<string, unknown>> {
  const tenant = await getTenantBySlugOrId(ctx.slug, ctx.tenantId);
  if (!tenant) return { error: 'Tenant not found' };

  const [{ count: articleCount }, { data: rawTags }] = await Promise.all([
    supabase.from('wiki_articles').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id),
    supabase.from('wiki_articles').select('tags').eq('tenant_id', tenant.id).not('tags', 'is', null),
  ]);

  const tagCounts: Record<string, number> = {};
  for (const row of (rawTags || []) as Array<{ tags: string[] | null }>) {
    for (const tag of row.tags || []) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }

  const uniqueTags = [...new Set((rawTags || []).flatMap(r => (r as { tags: string[] | null }).tags || []))].sort();

  return {
    wiki: { name: tenant.name, slug: tenant.slug, logo_url: tenant.logo_url, description: tenant.description },
    article_count: articleCount || 0,
    tags: uniqueTags,
    tag_counts: tagCounts,
  };
}

async function handleGetWikiArticle(args: { slug: string }, ctx: ToolContext): Promise<Record<string, unknown>> {
  const tenant = await getTenantBySlugOrId(ctx.slug, ctx.tenantId);
  if (!tenant) return { error: 'Tenant not found', article: null };

  const { data: wikiArticle } = await supabase
    .from('wiki_articles')
    .select('id, title, slug, summary, content, tags, updated_at')
    .eq('tenant_id', tenant.id)
    .eq('slug', args.slug)
    .single();

  if (wikiArticle) {
    const item_stats = parseContentToJson(wikiArticle.content);
    return { article: wikiArticle, item_stats };
  }

  const { data: byId } = await supabase
    .from('wiki_articles')
    .select('id, title, slug, summary, content, tags, updated_at')
    .eq('tenant_id', tenant.id)
    .eq('id', args.slug)
    .single();

  if (byId) {
    const item_stats = parseContentToJson(byId.content);
    return { article: byId, item_stats };
  }

  return { article: null, item_stats: null };
}

async function handleListWikiArticles(args: { tag?: string }, ctx: ToolContext): Promise<Record<string, unknown>> {
  const tenant = await getTenantBySlugOrId(ctx.slug, ctx.tenantId);
  if (!tenant) return { error: 'Tenant not found', articles: [] };

  let query = supabase
    .from('wiki_articles')
    .select('id, title, slug, summary, tags, updated_at')
    .eq('tenant_id', tenant.id);

  if (args.tag) {
    query = query.filter('tags', 'cs', `{${args.tag}}`);
  }

  const { data, error } = await query.order('title').limit(100);
  if (error) throw error;
  return { articles: data || [] };
}

async function handleListGameTables(_args: Record<string, never>, ctx: ToolContext): Promise<Record<string, unknown>> {
  const tenant = await getTenantBySlugOrId(ctx.slug, ctx.tenantId);
  if (!tenant) return { error: 'Tenant not found', tables: [] };

  const schema = await getGameSchema();
  const tables = await Promise.all(
    schema.tables.map(async (t) => {
      const { count } = await supabase
        .from(t.table_name)
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id);
      return {
        table: t.table_name,
        columns: t.columns.length,
        item_count: count || 0,
      };
    }),
  );

  return { tables };
}

async function handleGetTableSchema(args: { table: string }, _ctx: ToolContext): Promise<Record<string, unknown>> {
  const columns = await getTableSchema(args.table);
  if (columns.length === 0) return { error: `Table "${args.table}" not found in schema`, columns: [] };

  const systemCols = ['id', 'tenant_id', 'created_at', 'updated_at', 'embedding', 'slug', 'rank'];
  const numericTypes = new Set(['integer', 'bigint', 'smallint', 'numeric', 'real', 'double precision', 'double', 'float', 'decimal']);

  return {
    table: args.table,
    columns: columns.map(c => ({
      name: c.column_name,
      type: c.data_type,
      is_numeric: numericTypes.has(c.data_type),
      is_system: systemCols.includes(c.column_name) || c.is_system,
    })),
  };
}

async function handleFindColumns(args: { term: string }, _ctx: ToolContext): Promise<Record<string, unknown>> {
  const schema = await getGameSchema();
  const term = args.term.toLowerCase();
  const matches: Array<{ table: string; column: string; type: string }> = [];

  for (const t of schema.tables) {
    for (const c of t.columns) {
      if (c.column_name.toLowerCase().includes(term) && !c.is_system) {
        matches.push({ table: t.table_name, column: c.column_name, type: c.data_type });
      }
    }
  }

  return { term: args.term, matches };
}

async function handleGetItem(args: { table: string; name: string }, ctx: ToolContext): Promise<Record<string, unknown>> {
  const tenant = await getTenantBySlugOrId(ctx.slug, ctx.tenantId);
  if (!tenant) return { error: 'Tenant not found', item: null };

  const { data } = await supabase
    .from(args.table)
    .select('*')
    .eq('tenant_id', tenant.id)
    .ilike('name', `%${args.name}%`)
    .limit(5);

  if (!data || data.length === 0) {
    const { data: byExact } = await supabase
      .from(args.table)
      .select('*')
      .eq('tenant_id', tenant.id)
      .ilike('title', `%${args.name}%`)
      .limit(5);

    if (!byExact || byExact.length === 0) {
      return { table: args.table, item: null, message: `Item "${args.name}" not found in ${args.table}` };
    }
    return { table: args.table, items: byExact };
  }

  return { table: args.table, items: data };
}

async function handleQueryItems(args: { table: string; filters: Record<string, string>; limit?: number }, ctx: ToolContext): Promise<Record<string, unknown>> {
  const tenant = await getTenantBySlugOrId(ctx.slug, ctx.tenantId);
  if (!tenant) return { error: 'Tenant not found', items: [] };

  let query = supabase.from(args.table).select('*').eq('tenant_id', tenant.id);

  for (const [col, val] of Object.entries(args.filters)) {
    const numeric = !isNaN(Number(val));
    if (numeric) {
      query = query.eq(col, Number(val));
    } else {
      query = query.ilike(col, `%${val}%`);
    }
  }

  const limit = Math.min(args.limit ?? 20, 100);
  const { data, error } = await query.limit(limit);
  if (error) return { error: error.message, items: [] };
  return { table: args.table, filters: args.filters, items: data || [] };
}

async function handleFilterByRange(args: { table: string; column: string; min?: number; max?: number; limit?: number }, ctx: ToolContext): Promise<Record<string, unknown>> {
  const tenant = await getTenantBySlugOrId(ctx.slug, ctx.tenantId);
  if (!tenant) return { error: 'Tenant not found', items: [] };

  let query = supabase.from(args.table).select('*').eq('tenant_id', tenant.id);

  if (args.min !== undefined) query = query.gte(args.column, args.min);
  if (args.max !== undefined) query = query.lte(args.column, args.max);

  const limit = Math.min(args.limit ?? 20, 100);
  const { data, error } = await query.order(args.column, { ascending: false }).limit(limit);
  if (error) return { error: error.message, items: [] };
  return { table: args.table, column: args.column, range: { min: args.min, max: args.max }, items: data || [] };
}

async function handleSearchTable(args: { table: string; term: string; limit?: number }, ctx: ToolContext): Promise<Record<string, unknown>> {
  const tenant = await getTenantBySlugOrId(ctx.slug, ctx.tenantId);
  if (!tenant) return { error: 'Tenant not found', items: [] };

  const limit = Math.min(args.limit ?? 20, 50);
  const { data: byName, error: err1 } = await supabase
    .from(args.table)
    .select('*')
    .eq('tenant_id', tenant.id)
    .ilike('name', `%${args.term}%`)
    .limit(limit);

  if (byName && byName.length > 0) return { table: args.table, term: args.term, items: byName };

  const columns = await getTableSchema(args.table);
  const textCols = columns.filter(c => c.data_type === 'text' || c.data_type?.startsWith('character varying')).slice(0, 5);

  for (const col of textCols) {
    const { data } = await supabase
      .from(args.table)
      .select('*')
      .eq('tenant_id', tenant.id)
      .ilike(col.column_name, `%${args.term}%`)
      .limit(limit);
    if (data && data.length > 0) return { table: args.table, term: args.term, column: col.column_name, items: data };
  }

  return { table: args.table, term: args.term, items: [], message: `No items matching "${args.term}" found in ${args.table}` };
}

async function handleCountItems(args: { table: string; column?: string; value?: string }, ctx: ToolContext): Promise<Record<string, unknown>> {
  const tenant = await getTenantBySlugOrId(ctx.slug, ctx.tenantId);
  if (!tenant) return { error: 'Tenant not found', count: 0 };

  let query = supabase.from(args.table).select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id);

  if (args.column && args.value !== undefined) {
    const numeric = !isNaN(Number(args.value));
    if (numeric) {
      query = query.eq(args.column, Number(args.value));
    } else {
      query = query.eq(args.column, args.value);
    }
  }

  const { count, error } = await query;
  if (error) return { error: error.message, count: 0 };
  return { table: args.table, count: count || 0, filter: args.column ? { column: args.column, value: args.value } : null };
}

async function handleListItems(args: { table: string; offset?: number; limit?: number; sortBy?: string; sortDir?: string }, ctx: ToolContext): Promise<Record<string, unknown>> {
  const tenant = await getTenantBySlugOrId(ctx.slug, ctx.tenantId);
  if (!tenant) return { error: 'Tenant not found', items: [] };

  const limit = Math.min(args.limit ?? 20, 100);
  const offset = args.offset ?? 0;

  let query = supabase
    .from(args.table)
    .select('*')
    .eq('tenant_id', tenant.id);

  if (args.sortBy) {
    query = query.order(args.sortBy, { ascending: args.sortDir !== 'desc' });
  } else {
    query = query.order('name', { ascending: true });
  }

  const { data, error } = await query.range(offset, offset + limit - 1);
  if (error) return { error: error.message, items: [] };
  return { table: args.table, total: data?.length || 0, offset, limit, items: data || [] };
}

async function handleRankByStat(args: { table: string; stat: string; itemName: string }, ctx: ToolContext): Promise<Record<string, unknown>> {
  const tenant = await getTenantBySlugOrId(ctx.slug, ctx.tenantId);
  if (!tenant) return { error: 'Tenant not found', rank: null };

  const { data: allItems } = await supabase
    .from(args.table)
    .select('name, id, ' + args.stat)
    .eq('tenant_id', tenant.id)
    .not(args.stat, 'is', null)
    .order(args.stat, { ascending: false });

  if (!allItems || allItems.length === 0) return { error: 'No items found with this stat', rank: null };

  const target = allItems.findIndex((item: any) =>
    String(item.name).toLowerCase().includes(args.itemName.toLowerCase()),
  );

  if (target === -1) return { error: `Item "${args.itemName}" not found in ${args.table}`, rank: null };

  return {
    table: args.table,
    stat: args.stat,
    itemName: allItems[target].name,
    rank: target + 1,
    total: allItems.length,
    value: allItems[target][args.stat],
  };
}

async function handleCompareOnStat(args: { table: string; stat: string; limit?: number; descending?: boolean }, ctx: ToolContext): Promise<Record<string, unknown>> {
  const tenant = await getTenantBySlugOrId(ctx.slug, ctx.tenantId);
  if (!tenant) return { error: 'Tenant not found', items: [] };

  const limit = Math.min(args.limit ?? 10, 50);
  const desc = args.descending !== false;

  const { data, error } = await supabase
    .from(args.table)
    .select('name, id, ' + args.stat)
    .eq('tenant_id', tenant.id)
    .not(args.stat, 'is', null)
    .order(args.stat, { ascending: !desc })
    .limit(limit);

  if (error) return { error: error.message, items: [] };
  return { table: args.table, stat: args.stat, sorted_by: desc ? 'highest first' : 'lowest first', items: data || [] };
}

async function handleGetStatSummary(args: { table: string; column: string }, ctx: ToolContext): Promise<Record<string, unknown>> {
  const tenant = await getTenantBySlugOrId(ctx.slug, ctx.tenantId);
  if (!tenant) return { error: 'Tenant not found' };

  const { data: allItems } = await supabase
    .from(args.table)
    .select(args.column)
    .eq('tenant_id', tenant.id)
    .not(args.column, 'is', null);

  if (!allItems || allItems.length === 0) {
    return { table: args.table, column: args.column, message: 'No data available for this column' };
  }

  const values = allItems.map((i: any) => Number(i[args.column])).filter((v: number) => !isNaN(v));
  if (values.length === 0) {
    return { table: args.table, column: args.column, message: 'Column has no numeric values' };
  }

  return {
    table: args.table,
    column: args.column,
    count: allItems.length,
    numeric_count: values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    avg: +(values.reduce((a: number, b: number) => a + b, 0) / values.length).toFixed(2),
  };
}

async function handleGetTopItems(args: { table: string; stat: string; limit?: number }, ctx: ToolContext): Promise<Record<string, unknown>> {
  return handleCompareOnStat({ ...args, descending: true, limit: args.limit ?? 5 }, ctx);
}

async function handleGetCategoryAverages(args: { table: string; categoryColumn: string; statColumns?: string[] }, ctx: ToolContext): Promise<Record<string, unknown>> {
  const tenant = await getTenantBySlugOrId(ctx.slug, ctx.tenantId);
  if (!tenant) return { error: 'Tenant not found', groups: [] };

  const { data: allData } = await supabase
    .from(args.table)
    .select('*')
    .eq('tenant_id', tenant.id);

  if (!allData || allData.length === 0) return { table: args.table, groups: [] };

  const groups: Record<string, Record<string, number[]>> = {};

  for (const item of allData) {
    const cat = String(item[args.categoryColumn] ?? 'Unknown');
    if (!groups[cat]) groups[cat] = {};

    const cols = args.statColumns ?? Object.keys(item).filter(k => {
      if (['id', 'tenant_id', 'name', 'title', 'slug', 'description'].includes(k)) return false;
      return typeof item[k] === 'number';
    });

    for (const col of cols) {
      if (typeof item[col] === 'number') {
        if (!groups[cat][col]) groups[cat][col] = [];
        groups[cat][col].push(item[col]);
      }
    }
  }

  const result = Object.entries(groups).map(([cat, stats]) => ({
    category: cat,
    count: allData.filter((i: any) => String(i[args.categoryColumn] ?? 'Unknown') === cat).length,
    averages: Object.fromEntries(
      Object.entries(stats).map(([col, vals]) => [
        col,
        +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2),
      ]),
    ),
  }));

  return { table: args.table, grouped_by: args.categoryColumn, groups: result };
}

async function handleGetStatDistribution(args: { table: string; column: string }, ctx: ToolContext): Promise<Record<string, unknown>> {
  const tenant = await getTenantBySlugOrId(ctx.slug, ctx.tenantId);
  if (!tenant) return { error: 'Tenant not found', distribution: {} };

  const { data } = await supabase
    .from(args.table)
    .select(args.column)
    .eq('tenant_id', tenant.id)
    .not(args.column, 'is', null);

  if (!data || data.length === 0) return { table: args.table, column: args.column, distribution: {} };

  const counts: Record<string, number> = {};
  for (const item of data) {
    const val = String(item[args.column] ?? 'null');
    counts[val] = (counts[val] || 0) + 1;
  }

  return { table: args.table, column: args.column, total: data.length, distribution: counts };
}

async function handleCompareTwoItems(args: { tableA: string; nameA: string; tableB: string; nameB: string }, ctx: ToolContext): Promise<Record<string, unknown>> {
  const [itemA, itemB] = await Promise.all([
    handleGetItem({ table: args.tableA, name: args.nameA }, ctx),
    handleGetItem({ table: args.tableB, name: args.nameB }, ctx),
  ]);

  const aItems = (itemA as any).items || [(itemA as any).item];
  const bItems = (itemB as any).items || [(itemB as any).item];
  const a = aItems?.[0];
  const b = bItems?.[0];

  if (!a || !b) return { error: 'One or both items not found', itemA: a, itemB: b };

  const numericKeys = [...new Set([...Object.keys(a), ...Object.keys(b)])].filter(k =>
    typeof a[k] === 'number' || typeof b[k] === 'number',
  ).filter(k => !['id', 'tenant_id'].includes(k));

  const comparison = numericKeys.map(k => ({
    stat: k,
    a_value: a[k],
    b_value: b[k],
    difference: (a[k] ?? 0) - (b[k] ?? 0),
    a_is_higher: (a[k] ?? 0) > (b[k] ?? 0),
  }));

  return {
    itemA: { table: args.tableA, name: a.name || a.title },
    itemB: { table: args.tableB, name: b.name || b.title },
    comparison,
  };
}

async function handleFindSimilarItems(args: { table: string; itemName: string; limit?: number }, ctx: ToolContext): Promise<Record<string, unknown>> {
  const tenant = await getTenantBySlugOrId(ctx.slug, ctx.tenantId);
  if (!tenant) return { error: 'Tenant not found', similar: [] };

  const limit = Math.min(args.limit ?? 5, 20);

  const { data: target } = await supabase
    .from(args.table)
    .select('*')
    .eq('tenant_id', tenant.id)
    .ilike('name', `%${args.itemName}%`)
    .limit(1);

  if (!target || target.length === 0) return { error: `Item "${args.itemName}" not found`, similar: [] };

  const item = target[0];
  const numericCols = Object.entries(item).filter(([k, v]) => typeof v === 'number' && !['id'].includes(k)).map(([k]) => k);

  if (numericCols.length === 0) return { error: 'Item has no numeric stats to compare', similar: [] };

  const { data: allItems } = await supabase
    .from(args.table)
    .select('*')
    .eq('tenant_id', tenant.id);

  if (!allItems) return { similar: [] };

  const scored = allItems
    .filter((i: any) => i.id !== item.id)
    .map((i: any) => {
      let dist = 0;
      for (const col of numericCols) {
        const a = Number(item[col] ?? 0);
        const b = Number(i[col] ?? 0);
        dist += Math.abs(a - b);
      }
      return { ...i, _similarity: -dist };
    })
    .sort((a: any, b: any) => b._similarity - a._similarity)
    .slice(0, limit);

  return { table: args.table, referenceItem: item.name || item.title, numericCols, similar: scored };
}

async function handleSearchAllTables(args: { name: string }, ctx: ToolContext): Promise<Record<string, unknown>> {
  const tenant = await getTenantBySlugOrId(ctx.slug, ctx.tenantId);
  if (!tenant) return { error: 'Tenant not found', matches: [] };

  const schema = await getGameSchema();
  const matches: Array<{ table: string; name: string; id: string }> = [];

  for (const t of schema.tables) {
    const { data } = await supabase
      .from(t.table_name)
      .select('name, id')
      .eq('tenant_id', tenant.id)
      .ilike('name', `%${args.name}%`)
      .limit(5);

    if (data) {
      for (const item of data) {
        matches.push({ table: t.table_name, name: item.name, id: item.id });
      }
    }
  }

  return { searchTerm: args.name, totalMatches: matches.length, matches };
}

async function handleFindByCategory(args: { table: string; column: string; value: string; limit?: number }, ctx: ToolContext): Promise<Record<string, unknown>> {
  const tenant = await getTenantBySlugOrId(ctx.slug, ctx.tenantId);
  if (!tenant) return { error: 'Tenant not found', items: [] };

  const limit = Math.min(args.limit ?? 50, 200);

  const { data, error } = await supabase
    .from(args.table)
    .select('*')
    .eq('tenant_id', tenant.id)
    .eq(args.column, args.value)
    .limit(limit);

  if (error) return { error: error.message, items: [] };
  return { table: args.table, column: args.column, value: args.value, total: data?.length || 0, items: data || [] };
}

async function handleGetTableComparison(args: { tableA: string; tableB: string; stat: string }, ctx: ToolContext): Promise<Record<string, unknown>> {
  const [aResult, bResult] = await Promise.all([
    handleGetStatSummary({ table: args.tableA, column: args.stat }, ctx),
    handleGetStatSummary({ table: args.tableB, column: args.stat }, ctx),
  ]);

  return {
    tableA: { name: args.tableA, ...aResult },
    tableB: { name: args.tableB, ...bResult },
    stat: args.stat,
  };
}

async function handleGetItemNeighbors(args: { table: string; itemName: string; stat: string; percentRange?: number; limit?: number }, ctx: ToolContext): Promise<Record<string, unknown>> {
  const tenant = await getTenantBySlugOrId(ctx.slug, ctx.tenantId);
  if (!tenant) return { error: 'Tenant not found' };

  const limit = args.limit ?? 3;
  const range = (args.percentRange ?? 20) / 100;

  const { data: target } = await supabase
    .from(args.table)
    .select(`name, ${args.stat}`)
    .eq('tenant_id', tenant.id)
    .ilike('name', `%${args.itemName}%`)
    .limit(1);

  if (!target || target.length === 0) return { error: `Item "${args.itemName}" not found` };

  const targetVal = Number(target[0][args.stat]);
  if (isNaN(targetVal)) return { error: `Stat "${args.stat}" is not numeric for this item` };

  const { data: all } = await supabase
    .from(args.table)
    .select(`name, ${args.stat}`)
    .eq('tenant_id', tenant.id)
    .not(args.stat, 'is', null);

  if (!all) return { neighbors: [] };

  const lower = targetVal * (1 - range);
  const upper = targetVal * (1 + range);

  const worse = all
    .filter((i: any) => Number(i[args.stat]) < targetVal && Number(i[args.stat]) >= lower && i.id !== target[0].id)
    .sort((a: any, b: any) => Number(b[args.stat]) - Number(a[args.stat]))
    .slice(0, limit);

  const better = all
    .filter((i: any) => Number(i[args.stat]) > targetVal && Number(i[args.stat]) <= upper && i.id !== target[0].id)
    .sort((a: any, b: any) => Number(a[args.stat]) - Number(b[args.stat]))
    .slice(0, limit);

  return {
    table: args.table,
    stat: args.stat,
    targetItem: target[0].name,
    targetValue: targetVal,
    range: `${(range * 100).toFixed(0)}%`,
    neighborsBelow: worse,
    neighborsAbove: better,
  };
}

async function handleFindUpgrades(args: { table: string; itemName: string; stats: string[]; limit?: number }, ctx: ToolContext): Promise<Record<string, unknown>> {
  const tenant = await getTenantBySlugOrId(ctx.slug, ctx.tenantId);
  if (!tenant) return { error: 'Tenant not found', upgrades: [] };

  const limit = Math.min(args.limit ?? 10, 30);

  const { data: target } = await supabase
    .from(args.table)
    .select('*')
    .eq('tenant_id', tenant.id)
    .ilike('name', `%${args.itemName}%`)
    .limit(1);

  if (!target || target.length === 0) return { error: `Item "${args.itemName}" not found` };

  const item = target[0];
  const { data: all } = await supabase
    .from(args.table)
    .select('*')
    .eq('tenant_id', tenant.id);

  if (!all) return { upgrades: [] };

  const upgrades = all
    .filter((other: any) => {
      if (other.id === item.id) return false;
      for (const s of args.stats) {
        if ((other[s] ?? -Infinity) <= (item[s] ?? -Infinity)) return false;
      }
      return true;
    })
    .map((other: any) => {
      const diffs: Record<string, number> = {};
      for (const s of args.stats) {
        diffs[s] = (other[s] ?? 0) - (item[s] ?? 0);
      }
      return { ...other, _improvements: diffs };
    })
    .sort((a: any, b: any) => {
      const aTotal = Object.values(a._improvements).reduce((s: any, v: any) => s + v, 0);
      const bTotal = Object.values(b._improvements).reduce((s: any, v: any) => s + v, 0);
      return bTotal - aTotal;
    })
    .slice(0, limit);

  return {
    table: args.table,
    referenceItem: item.name,
    comparedStats: args.stats,
    upgradesFound: upgrades.length,
    upgrades,
  };
}

async function handleGetStatTrend(args: { table: string; statA: string; statB: string }, ctx: ToolContext): Promise<Record<string, unknown>> {
  const tenant = await getTenantBySlugOrId(ctx.slug, ctx.tenantId);
  if (!tenant) return { error: 'Tenant not found' };

  const { data } = await supabase
    .from(args.table)
    .select(`${args.statA}, ${args.statB}`)
    .eq('tenant_id', tenant.id)
    .not(args.statA, 'is', null)
    .not(args.statB, 'is', null);

  if (!data || data.length < 3) return { error: 'Not enough data points for correlation analysis' };

  const pairs = data
    .map((d: any) => ({ a: Number(d[args.statA]), b: Number(d[args.statB]) }))
    .filter(p => !isNaN(p.a) && !isNaN(p.b));

  if (pairs.length < 3) return { error: 'Not enough numeric data points' };

  const n = pairs.length;
  const sumA = pairs.reduce((s, p) => s + p.a, 0);
  const sumB = pairs.reduce((s, p) => s + p.b, 0);
  const sumAB = pairs.reduce((s, p) => s + p.a * p.b, 0);
  const sumA2 = pairs.reduce((s, p) => s + p.a * p.a, 0);
  const sumB2 = pairs.reduce((s, p) => s + p.b * p.b, 0);

  const r = (n * sumAB - sumA * sumB) / Math.sqrt((n * sumA2 - sumA * sumA) * (n * sumB2 - sumB * sumB));

  return {
    table: args.table,
    statA: args.statA,
    statB: args.statB,
    dataPoints: n,
    correlation_r: +r.toFixed(4),
    interpretation: r > 0.5 ? 'Positiva (valores altos de A tendem a ter B alto)' :
      r < -0.5 ? 'Negativa (valores altos de A tendem a ter B baixo)' :
      'Fraca (nenhuma relação linear clara)',
  };
}

async function handleGetWikiTags(_args: Record<string, never>, ctx: ToolContext): Promise<Record<string, unknown>> {
  const result = await handleGetWikiInfo({}, ctx);
  const info = result as any;
  return { tags: info.tags || [], tag_counts: info.tag_counts || {} };
}

async function handleSearchWikiPages(args: { query: string; limit?: number }, ctx: ToolContext): Promise<Record<string, unknown>> {
  const tenant = await getTenantBySlugOrId(ctx.slug, ctx.tenantId);
  if (!tenant) return { error: 'Tenant not found', pages: [] };

  const limit = Math.min(args.limit ?? 10, 30);

  const { data: byTitle } = await supabase
    .from('wiki_articles')
    .select('id, title, slug, summary, tags, updated_at')
    .eq('tenant_id', tenant.id)
    .ilike('title', `%${args.query}%`)
    .limit(limit);

  if (byTitle && byTitle.length >= limit) return { query: args.query, pages: byTitle };

  const { data: bySummary } = await supabase
    .from('wiki_articles')
    .select('id, title, slug, summary, tags, updated_at')
    .eq('tenant_id', tenant.id)
    .ilike('summary', `%${args.query}%`)
    .limit(limit);

  const existingIds = new Set((byTitle || []).map((p: any) => p.id));
  const merged = [...(byTitle || [])];
  for (const page of bySummary || []) {
    if (!existingIds.has(page.id)) merged.push(page);
  }

  return { query: args.query, pages: merged.slice(0, limit) };
}

async function handleListPagesByTag(args: { tag?: string; limit?: number }, ctx: ToolContext): Promise<Record<string, unknown>> {
  return handleListWikiArticles({ tag: args.tag }, ctx);
}

async function handleGetRecentPages(args: { limit?: number; days?: number }, ctx: ToolContext): Promise<Record<string, unknown>> {
  const tenant = await getTenantBySlugOrId(ctx.slug, ctx.tenantId);
  if (!tenant) return { error: 'Tenant not found', pages: [] };

  const limit = Math.min(args.limit ?? 10, 30);
  const days = args.days ?? 30;

  let query = supabase
    .from('wiki_articles')
    .select('id, title, slug, summary, updated_at, created_at')
    .eq('tenant_id', tenant.id);

  if (days > 0) {
    const cutoff = new Date(Date.now() - days * 86400000).toISOString();
    query = query.gte('updated_at', cutoff);
  }

  const { data } = await query.order('updated_at', { ascending: false }).limit(limit);
  return { pages: data || [] };
}

// ── New tool handlers ──

async function handleEvaluateMath(args: { expression: string; precision?: number }): Promise<MathResult> {
  return evaluateMath(args.expression, args.precision);
}

async function handleBatchWikiSearch(args: { queries: string[] }, ctx: ToolContext): Promise<Record<string, unknown>> {
  const terms = (args.queries || []).slice(0, 10);
  const results = await Promise.all(
    terms.map(q => handleSearchWiki({ query: q }, ctx).catch(() => null)),
  );
  const combined: Record<string, unknown[]> = { wiki: [], collection: [], game_items: [] };
  for (const r of results) {
    if (r) {
      const data = r as SearchAllResult;
      if (data.wiki) combined.wiki.push(...data.wiki);
      if (data.collection) combined.collection.push(...data.collection);
      if (data.game_items) combined.game_items.push(...data.game_items);
    }
  }
  return { queries: terms, totalWiki: combined.wiki.length, totalItems: combined.game_items.length, ...combined };
}

async function handleSearchByExample(args: { table: string; itemName: string; matchColumns?: string[]; limit?: number }, ctx: ToolContext): Promise<Record<string, unknown>> {
  const tenant = await getTenantBySlugOrId(ctx.slug, ctx.tenantId);
  if (!tenant) return { error: 'Tenant not found', similar: [] };

  const limit = Math.min(args.limit ?? 5, 20);

  const { data: target } = await supabase
    .from(args.table)
    .select('*')
    .eq('tenant_id', tenant.id)
    .ilike('name', `%${args.itemName}%`)
    .limit(1);

  if (!target || target.length === 0) return { error: `Item "${args.itemName}" not found`, similar: [] };

  const item = target[0];
  const cols = args.matchColumns ?? Object.entries(item)
    .filter(([k, v]) => typeof v === 'number' && !['id'].includes(k))
    .map(([k]) => k);

  if (cols.length === 0) return { error: 'No numeric columns to compare', similar: [] };

  const { data: allItems } = await supabase
    .from(args.table)
    .select('*')
    .eq('tenant_id', tenant.id);

  if (!allItems) return { similar: [] };

  const ranges: Record<string, { min: number; max: number }> = {};
  for (const col of cols) {
    const vals = allItems.map(i => Number(i[col])).filter(v => !isNaN(v));
    if (vals.length > 0) {
      ranges[col] = { min: Math.min(...vals), max: Math.max(...vals) };
    }
  }

  if (Object.keys(ranges).length === 0) return { similar: [] };

  const scored = allItems
    .filter((i: any) => i.id !== item.id)
    .map((i: any) => {
      let totalSim = 0;
      let count = 0;
      for (const col of cols) {
        const range = ranges[col];
        if (!range || range.max === range.min) continue;
        const a = Number(item[col] ?? range.min);
        const b = Number(i[col] ?? range.min);
        const aNorm = (a - range.min) / (range.max - range.min);
        const bNorm = (b - range.min) / (range.max - range.min);
        totalSim += 1 - Math.abs(aNorm - bNorm);
        count++;
      }
      return { item: i, similarity: count > 0 ? +(totalSim / count * 100).toFixed(1) : 0 };
    })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  return {
    table: args.table,
    referenceItem: item.name || item.title,
    matchColumns: cols,
    similar: scored.map(s => ({ ...s.item, _similarity_pct: s.similarity })),
  };
}

async function handleFormatAsTable(args: { table: string; columns?: string[]; itemNames?: string[]; sortBy?: string; sortDir?: string; limit?: number }, ctx: ToolContext): Promise<Record<string, unknown>> {
  const tenant = await getTenantBySlugOrId(ctx.slug, ctx.tenantId);
  if (!tenant) return { error: 'Tenant not found', table: '' };

  const limit = args.itemNames?.length ? args.itemNames.length : Math.min(args.limit ?? 20, 50);
  let query = supabase
    .from(args.table)
    .select('*')
    .eq('tenant_id', tenant.id);

  if (args.itemNames && args.itemNames.length > 0) {
    const names = args.itemNames.slice(0, 50);
    query = query.in('name', names);
  }

  if (args.sortBy) {
    query = query.order(args.sortBy, { ascending: args.sortDir !== 'desc' });
  } else {
    query = query.order('name', { ascending: true });
  }

  const { data, error } = await query.limit(limit);
  if (error) return { error: error.message, table: args.table, markdown: '' };
  if (!data || data.length === 0) return { table: args.table, markdown: '*Nenhum item encontrado.*' };

  const allKeys = Object.keys(data[0]);
  const cols = args.columns?.length
    ? args.columns.filter(c => allKeys.includes(c))
    : ['name', ...allKeys.filter(k => typeof data[0][k] === 'number' && !['id', 'tenant_id'].includes(k))].slice(0, 10);

  const header = `| ${cols.map(c => c).join(' | ')} |`;
  const separator = `| ${cols.map(() => '---').join(' | ')} |`;
  const rows = data.map((item: any) =>
    `| ${cols.map(c => {
      const v = item[c];
      if (v === null || v === undefined) return '-';
      if (typeof v === 'number') return String(v);
      return String(v).slice(0, 40);
    }).join(' | ')} |`,
  );

  return {
    table: args.table,
    columns: cols,
    rowCount: data.length,
    markdown: [header, separator, ...rows].join('\n'),
  };
}

async function handleGetRecentItems(args: { days?: number; limit?: number }, ctx: ToolContext): Promise<Record<string, unknown>> {
  const tenant = await getTenantBySlugOrId(ctx.slug, ctx.tenantId);
  if (!tenant) return { error: 'Tenant not found', tables: [] };

  const days = args.days ?? 7;
  const limit = Math.min(args.limit ?? 5, 20);
  const cutoff = days > 0 ? new Date(Date.now() - days * 86400000).toISOString() : '1970-01-01';

  const schema = await getGameSchema();
  const tableResults = await Promise.all(
    schema.tables.map(async (t) => {
      const { data, count } = await supabase
        .from(t.table_name)
        .select('name, slug, created_at, updated_at', { count: 'exact', head: false })
        .eq('tenant_id', tenant.id)
        .gte('created_at', cutoff)
        .order('created_at', { ascending: false })
        .limit(limit);
      return { table: t.table_name, count: count || 0, items: data || [] };
    }),
  );

  return {
    days,
    totalNewItems: tableResults.reduce((s, r) => s + r.count, 0),
    tables: tableResults.filter(r => r.count > 0),
  };
}

async function handleGetRelatedItems(args: { table: string; itemName: string }, ctx: ToolContext): Promise<Record<string, unknown>> {
  const tenant = await getTenantBySlugOrId(ctx.slug, ctx.tenantId);
  if (!tenant) return { error: 'Tenant not found', relations: [] };

  const { data: item } = await supabase
    .from(args.table)
    .select('name, slug, id')
    .eq('tenant_id', tenant.id)
    .ilike('name', `%${args.itemName}%`)
    .limit(1);

  if (!item || item.length === 0) return { error: `Item "${args.itemName}" not found in ${args.table}`, relations: [] };

  const target = item[0];

  const singularMap: Record<string, string> = {
    weapons: 'weapon', armors: 'armor', rings: 'ring', enemies: 'enemy',
    bosses: 'boss', potions: 'potion', upgrades: 'upgrade', worlds: 'world',
    resources: 'resource', crafting_recipes: 'recipe',
  };

  const expectedFks = [`${singularMap[args.table] || args.table.slice(0, -1)}_id`, `${singularMap[args.table] || args.table.slice(0, -1)}_name`];

  const schema = await getGameSchema();
  const relations: Array<{ table: string; column: string; items: unknown[] }> = [];

  for (const t of schema.tables) {
    if (t.table_name === args.table) continue;
    const fkCols = t.columns.filter(c =>
      expectedFks.includes(c.column_name) || c.column_name.endsWith('_id') || c.column_name.endsWith('_name'),
    ).slice(0, 3);

    for (const col of fkCols) {
      const { data } = await supabase
        .from(t.table_name)
        .select('name, slug, id')
        .eq('tenant_id', tenant.id)
        .eq(col.column_name, target.name)
        .limit(10);

      if (data && data.length > 0) {
        relations.push({ table: t.table_name, column: col.column_name, items: data });
      }
    }

    const { data: nameMatch } = await supabase
      .from(t.table_name)
      .select('name, slug, id')
      .eq('tenant_id', tenant.id)
      .ilike('name', `%${target.name}%`)
      .limit(5);

    if (nameMatch && nameMatch.length > 0) {
      const alreadyCounted = relations.filter(r => r.table === t.table_name).reduce((s, r) => s + r.items.length, 0);
      if (alreadyCounted < nameMatch.length) {
        relations.push({
          table: t.table_name,
          column: 'name (text match)',
          items: nameMatch.slice(0, alreadyCounted > 0 ? 0 : 5),
        });
      }
    }
  }

  return {
    itemName: target.name,
    table: args.table,
    relationCount: relations.length,
    relations: relations.filter(r => r.items.length > 0),
  };
}

async function handleMultiTableQuery(args: { tables: string[]; filters: Record<string, string>; limit?: number }, ctx: ToolContext): Promise<Record<string, unknown>> {
  const tenant = await getTenantBySlugOrId(ctx.slug, ctx.tenantId);
  if (!tenant) return { error: 'Tenant not found', results: {} };

  const tables = (args.tables || []).slice(0, 5);
  const limit = Math.min(args.limit ?? 10, 30);

  const results = await Promise.all(
    tables.map(async (table) => {
      let query = supabase.from(table).select('*').eq('tenant_id', tenant.id);
      for (const [col, val] of Object.entries(args.filters)) {
        const numeric = !isNaN(Number(val));
        if (numeric) {
          query = query.eq(col, Number(val));
        } else {
          query = query.ilike(col, `%${val}%`);
        }
      }
      const { data, count } = await query.limit(limit);
      return { table, count: (data || []).length, items: data || [] };
    }),
  );

  return {
    filters: args.filters,
    totalResults: results.reduce((s, r) => s + r.count, 0),
    tables: results,
  };
}

async function handleBatchGetItems(args: { table: string; names: string[] }, ctx: ToolContext): Promise<Record<string, unknown>> {
  const names = (args.names || []).slice(0, 10);
  const results = await Promise.all(
    names.map(async (name) => {
      try {
        const r = await handleGetItem({ table: args.table, name }, ctx);
        return { name, result: r };
      } catch {
        return { name, result: { error: `Failed to fetch "${name}"` } };
      }
    }),
  );

  return {
    table: args.table,
    requested: names,
    found: results.filter(r => !(r.result as any).error),
    failed: results.filter(r => !!(r.result as any).error),
  };
}

// ── Map dispatcher ──

const toolHandlers = new Map<string, (args: any, ctx: ToolContext) => Promise<unknown>>([
  ['searchWiki', handleSearchWiki],
  ['getWikiInfo', handleGetWikiInfo],
  ['getWikiArticle', handleGetWikiArticle],
  ['listWikiArticles', handleListWikiArticles],
  ['listGameTables', handleListGameTables],
  ['getTableSchema', handleGetTableSchema],
  ['findColumns', handleFindColumns],
  ['getItem', handleGetItem],
  ['queryItems', handleQueryItems],
  ['filterByRange', handleFilterByRange],
  ['searchTable', handleSearchTable],
  ['countItems', handleCountItems],
  ['listItems', handleListItems],
  ['rankByStat', handleRankByStat],
  ['compareOnStat', handleCompareOnStat],
  ['getStatSummary', handleGetStatSummary],
  ['getTopItems', handleGetTopItems],
  ['getCategoryAverages', handleGetCategoryAverages],
  ['getStatDistribution', handleGetStatDistribution],
  ['compareTwoItems', handleCompareTwoItems],
  ['findSimilarItems', handleFindSimilarItems],
  ['searchAllTables', handleSearchAllTables],
  ['findByCategory', handleFindByCategory],
  ['getTableComparison', handleGetTableComparison],
  ['getItemNeighbors', handleGetItemNeighbors],
  ['findUpgrades', handleFindUpgrades],
  ['getStatTrend', handleGetStatTrend],
  ['getWikiTags', handleGetWikiTags],
  ['searchWikiPages', handleSearchWikiPages],
  ['listPagesByTag', handleListPagesByTag],
  ['getRecentPages', handleGetRecentPages],
  ['evaluateMath', handleEvaluateMath],
  ['batchWikiSearch', handleBatchWikiSearch],
  ['searchByExample', handleSearchByExample],
  ['formatAsTable', handleFormatAsTable],
  ['getRecentItems', handleGetRecentItems],
  ['getRelatedItems', handleGetRelatedItems],
  ['multiTableQuery', handleMultiTableQuery],
  ['batchGetItems', handleBatchGetItems],
]);

export async function executeTextChatTool(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext,
): Promise<unknown> {
  const handler = toolHandlers.get(name);
  if (!handler) return { error: `Unknown tool: ${name}. Available: ${[...toolHandlers.keys()].join(', ')}` };
  return handler(args, ctx);
}

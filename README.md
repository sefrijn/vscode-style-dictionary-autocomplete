# Style Dictionary Autocomplete

This plugin will provide suggestions for reference tokens.

# Context prompt for AI:

This is a VSCode extension for Style Dictionary. It provides an autocomplete for Style Dictionary reference tokens. You can specify a folder to scan for json files, which will be parsed to autocomplete strings. The following file will be converted to the following format.
Input file:

```
{
  "eindhoven": {
    "color": {
      "red": {
        "300": {
          "value": "hsl(359, 77%, 65%)",
          "type": "color",
          "description": "Van huidige website Eindhoven.nl"
        }
      }
    }
  }
}
```

Output autocomplete string:

```
eindhoven.color.red.300
```

The plugin should only trigger on items that have a `value` key inside.

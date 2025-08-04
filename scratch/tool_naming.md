
### claude web

asdf

https://claude.ai/chat/eb459010-9a33-4c0d-a95a-948d21e5b97e

- str_replace
- new_str
- old_str

and wtf is "str_replace_editor" ?


{
  `path`: `/Users/stuart/repos/slupe/proj/comp/instruct-gen/test-data/unit/loadBaseInstructions.json`,
  `command`: `str_replace`,
  `new_str`: `{
  \"cases\": [
    {
      \"name\": \"loads base instructions template\",
      \"input\": [],
      \"verify\": {
        \"contains\": [
          \"## Actions\"
        ],
        \"type\": \"string\"
      }
    }
  ]
}`,
  `old_str`: `{
  \"cases\": [
    {
      \"name\": \"loads base instructions template\",
      \"input\": [],
      \"verify\": {
        \"contains\": [
          \"# NESL Actions API Reference\",
          \"## Actions\",
          \"## Other Section\"
        ],
        \"type\": \"string\"
      }
    }
  ]
}`
}
Tool 'str_replace_editor' not found.


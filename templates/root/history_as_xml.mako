<?xml version="1.0"?>
<history>
  %for data in history.active_datasets:
    <data id="${data.id}" hid="${data.hid}" name="${data.name}" state="${data.state}" dbkey="${data.dbkey}">
      ${_(data.blurb)}
    </data>
  %endfor
</history>

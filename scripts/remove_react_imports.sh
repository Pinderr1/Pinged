#!/bin/bash
for file in "$@"; do
  sed -i -e "s/^import React, {/import {/" \
         -e "s/^import React from 'react';//" \
         -e "s/^import React from \"react\";//" \
         -e "s/^import React,{/import {/" \
         "$file"
done

#import "/src/components/typx.typ": h, component, meta

#show: meta.with(title: "Minimal Typx Home", layout: "default")

#let typx-counter = component("/src/components/counter.ts", "typx-counter")

= Minimal Typx Setup

Welcome to the simplified Typx project. All unnecessary styling has been removed to leave just the core formatting.

== Features

- Clean, minimal design
- High performance
- Easy to read

== Interactive Component

Here is a functional counter button:

#typx-counter(class: "btn counter")[Count is 0]

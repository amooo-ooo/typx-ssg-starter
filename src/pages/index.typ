#import "/src/components/typx.typ": h, component, meta

#show: meta.with(title: "Minimal Typx Home", layout: "default")

#let typx-counter = component("/src/components/counter.ts", "typx-counter")

= Get started

Edit `src/pages/index.typ` and save to test HMR. This page uses the `default` layout.

== Features

- Clean, minimal design
- High performance
- Easy to read

== Interactive Component

Here is a functional counter:

#typx-counter(class: "btn counter")[Count is 0] 

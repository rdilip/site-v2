---
title: Everything is an ODE
date: October 5, 2025
---

We recently published [Kanzi](https://arxiv.org/abs/2510.00351), a model which does protein structure tokenization. tl;dr: a protein is a “thing” that does “stuff” in biology. The “stuff” can be defending your body against foreign invaders, building muscle, digesting your food, and basically 99% of things that happen in biological processes. The “thing” comes in all shapes and sizes, so protein structure generation involves making a “thing” that can do “stuff” that we care about. If someone has COVID, I want to make a thing that fights off the COVID etc etc.

We parameterize protein structures as arrays with shape (L, 3). L can vary from tiny (like 16) to several thousand. What Kanzi does is take this (L, 3) tensor and give you a length L sequence of discrete tokens, which you can then use to train a language model. Language models just see tokens — their job is to learn how these tokens correspond and relate to one another. You use Kanzi to encode protein structures into tokens, forget about the proteins and train a language model in token-land, then use the model to generate new tokens, which you can decode (using Kanzi) back to protein structures.

Okay, but all I’ve done is describe something called *tokenization*. What’s new? The main advance is we use a diffusion model to train Kanzi. Diffusion/flow models  (I use the terms interchangeably, ostensibly because they’re the same in $\mathbb{R}^n$  but really because I’m too lazy to standardize) interpolate between clean data and noise, and learn to reverse this interpolation. With Kanzi, we encode a protein to a sequence of tokens, and this sequence is fed into a diffusion model which outputs the protein.

There are some downsides of this approach. The big one is it’s slow — with decoding, you need to run your decoder model many times to generate a protein (but really, do we care about fast protein models?). There are two big upsides that I’ve been thinking about a lot lately I want to mention.

The first is that while the tokens are deterministic, the actual protein that we decode to is *stochastic*. It’ll change depending on the diffusion model seed. This may seem undesirable, but it actually has a really nice interpretation, because proteins in real life are generally quite stochastic. They’re constantly wriggling and moving around, and this is something people really want to capture. This feels like a first step towards tokens that can capture these sorts of dynamics.

The second point — I was very surprised by how good the reconstruction results were at first, since the model is *tiny*. It’s a little baby 30M parameter tokenizer. State of the art protein tokenizers are usually anywhere from 100M (DPLM2) to 600M (ESM3) parameters trained on tens to hundreds of millions of structures. What gives? 

To answer this, it helps to think a little bit about AlphaFold2. AlphaFold2 solved [1] the protein folding problem, which basically predicts these structures. One of their key insights was to use a “structure module.” They build up a really complex latent representation of a protein, then the structure module iteratively turns that into a structure. Notice I said iteratively — the structure module runs eight cycles of a sub-module *using the same weights*. This is interesting because this looks like a very coarse, 8-step diffusion model! It’s not quite the same — they don’t have random initialization — but it’s very close, and I’m guessing this similarity prompted a lot of the changes in AlphaFold3 (which is basically a giant diffusion model). 

The perspective I really like goes back to the classic neural ODEs paper ([https://arxiv.org/pdf/1806.07366](https://arxiv.org/pdf/1806.07366)). They make a really elegant point, which is that typically the way deep neural networks work is we build complex representations by stacking layers. Basically, we do

$$
\mathbf{h}_{t+1} = \mathbf{h}_t + f_{\theta}(\mathbf{h}_t)
$$

$t$ is a bit of bad notation for the layer index. But if we add layers and take smaller steps, this starts to look like a discretization, so we could write

$$
\mathbf{h}_{t+1} - \mathbf{h}_t = \Delta t\, f_{\theta}(\mathbf{h}_t)\leftrightarrow \frac{d\mathbf{h}}{dt} = f_{\theta}(\mathbf{h}(t), t)
$$

And indeed, this is basically how diffusion and flow matching work. We view the network as parameterizing an ODE, and just run the ODE at inference using standard Euler integration. 

In other words, one way of viewing a diffusion model is a very parameter efficient version of a bigger model! The bigger model needs to do all of this precise work in one step, which is hard. The diffusion model just runs an integration, which trades off inference time for parameter count. This raises some interesting questions (do FLOPs expended end up being similar? [2]), but I think this is just a really beautiful explanation. It’s not new by any means, but it does explain a lot of why diffusion based tokenizers on this task seem to be outperforming or matching much larger tokenizers. 

For what it’s worth, I’m very bullish on this approach. I think tokenization in biology is really important, because there are a bunch of different data modalities that are undertapped in understanding bio. People are excited about everything from DNA to 3D representations of cells, but all the ML conferences are just like "protein protein protein." Our experiences training Kanzi make me feel like the diffusion tokenizer approach is a much more scalable path to build novel biological representations. 

[1] Yeah yeah yeah, okay they didn’t solve it, but they did better than anyone else by a huge margin. Shush, biologists.

[2] I really want to know what the hell the “one step consistency/diffusion models” are doing, since they seem to get excellent performance but are basically trying to reconstruct a ton of detailed information in a single pass. If you think this inference/parameter tradeoff sounds reasonable (I do) then the existence of things like ([https://arxiv.org/pdf/2505.13447](https://arxiv.org/pdf/2505.13447)) seems to break that picture.
---
title: A very quick intro to generative biology
date: October 5, 2025
---


Someone raised the fair point that if I just bother to write up a proper introduction to the sorts of problems I think about, I can probably get much better feedback and interactions. More broadly, I think biology is a wonderful playground for a lot of important ideas in modern deep learning — multimodality, generative modeling vs understanding, etc, but is largely hidden behind overly complicated language and vocabulary. The core ideas are quite simple and accessible to anyone who does machine learning.

---


A protein is a particular type of biological structure. Proteins are present in basically some way, shape, or form for literally every single thing that happens in biology. When we say DNA is the code of life, a lot of it is just telling the body how to make certain proteins. 

As you can imagine, this level of generalization requires a tremendous amount of diversity. The general protein blueprint needs to be able to churn out proteins of all shapes and sizes, from proteins that induce motion to proteins that fight off pathogens. Years of evolution have hammered out a very simple blueprint: the body has 20 individual building blocks, amino acids. It links up these amino acids together in a chain. Different chains will *fold* to different structures.

All of the complexity of life comes from this tiny size 20 vocabulary. That’s it! This is quite elegant, but perhaps unsurprising. In the same way that the space of images is incredibly diverse, yet much smaller than the naive $256^{L\times L}$ size that a naive guess would suggest, the keys for everything your body will ever need are buried inside sequences of these $20$ possible tokens. 

As a historical touchpoint, we can clarify what people mean when they say AlphaFold2 solved the protein folding problem. The protein folding problem asks to predict the $L\times 3$ structure given the $L$ sequence of tokens [1]. That’s what AlphaFold2 does: it goes from “sequence” to “structure.” 

The goal of generative structure modeling is to generate plausible biological structures. Let’s describe this by analogy with images. In image modeling, we want to generate images that describe something meaningful. In the loosest sense, a random assortment of $L\times L$ pixels does not look like a real image. Similarly, a random set of $L\times 3$ coordinates does not look like a real protein.  At a high level, in image generation we go from noise to an $L\times L$ image (possibly with some conditioning, e.g., a text label). In structure generation we go from noise to a $L \times 3$ point cloud.

One interesting thing about protein structures is they tend to appear in three broad categories. Alpha helices are tight coils (see the left hand structure). Beta sheets are flat stripes (see the right hand structure). Everything else are generic, unstructured coils. Again, I find this simplicity quite elegant. For all the complexity of life, we really have just three levels of structure that describe basically everything that ever matters.

<div style="display: flex; justify-content: center; gap: 1rem;">
  <img src="posts/images/alpha.png" alt="A protein with lots of alpha helices" style="width: 20%; border-radius: 20px;">
  <img src="posts/images/beta.png" alt="A protein that's mostly beta sheets" style="width: 20%; border-radius: 20px;">
</div>

### Data defines the task space

Okay, so we can represent a protein using a sequence of those 20 possible tokens or as a structure. These modalities define a space of possible tasks. As we mentioned, AlphaFold2 is a *protein folding* model, so it goes from sequence → structure. But you can also define *inverse folding models,* that go from structure → sequence. *Generative models* go from noise to either sequence or structure (or both simultaneously). 

### Where do we go from here?

Hopefully the task is clear. If you understand roughly how generative models work, then you understand how protein generation works. 

One open direction that I think is particularly important is how we measure the fidelity of generative models. Once you train your protein generation method, it predicts some structures, but how do you know those structures are real? The current method is roughly the following:

1. Take the structure and use an *inverse folding model* to predict a sequence that “would fold into that structure.”
2.  Use an additional *folding model* to fold that sequence — now you have a new structure.
3. Compare the original structure and the new structure. That’s your metric.

This has a ton of problems — it’s expensive to compute and it’s very sensitive to the off the shelf model you use. Current generative models have mostly saturated that benchmark.

A separate direction has been to use distribution level metrics. Briefly, you generate a bunch of proteins, *embed* those proteins using an off the shelf pretrained model (something like a classifier), fit the embeddings to a multivariate Gaussian, then look at the distance between the two Gaussians. This mirrors Frechet Inception Distance, but an open question is whether we can pretrain models that result in embeddings as rich as those pretrained using ImageNet classification. I’m optimistic about this general direction, and we saw some early suggestions that this is a useful metric to hill climb when working on [Kanzi]([https://www.rohitdilip.com/assets/kanzi_all_authors.pdf](https://www.rohitdilip.com/assets/kanzi_all_authors.pdf)).

Expanding data modalities is another direction that I think will be fruitful. Proteins interact with other proteins, with DNA, with small molecules, and more; in that sense, designing single proteins isn’t particularly interesting. [AlphaFold3](https://www.nature.com/articles/s41586-024-07487-w) can process small molecules and DNA, and I think more recent point cloud representations will be much more fruitful at expanding the range of biological modalities we can process. 

A lot of generative models, including both AlphaFold3 and Proteina, are trained heavily on synthetic datasets from AlphaFold2 predictions. As with all cases involving synthetic data, I think we’ll have to think carefully about how far we are from “real proteins,” and how to correct for the ways in which we’re biasing our models with these training paradigms. 

The last ML-level trend that I want to mention is richer conditioning. Right now, generative model metrics are very coarse and honestly a bit silly. We look at metrics that measure “is this protein real” and “can your model generate lots of different types of proteins,” but what we really want is the ability to condition on specific design tasks. Questions like “can your protein bind and neutralize COVID?” are harder tasks to define but much more important than being able to generate random assortments of proteins. Techniques from computer vision don’t always carry over well; proteins are discrete sequences, so they can’t be smoothly resized. 3D vision often deals with much larger collections of points. 

All that being said, I think we are on the cusp of being able to do really deliberate design, where we’re conditioning on more rich and nuanced context. [Proteina]([https://arxiv.org/abs/2503.00710](https://arxiv.org/abs/2503.00710))  was one interesting approach that conditioned on “fold classes,” which are more nuanced classifications of the three types of structure I mentioned above. [PLAID]([https://www.biorxiv.org/content/10.1101/2024.12.02.626353v1.full.pdf](https://www.biorxiv.org/content/10.1101/2024.12.02.626353v1.full.pdf)) is another approach I liked, where it conditions on biological classifications (e.g., “this protein does X”) instead of structural categories. More broadly, however, I think we should think about where the real use-cases for these models are. To my knowledge, the instances where folks have used protein generative models to actually, you know, design a real protein that’s useful for something *other* than a benchmark have involved very restricted environments and targets. If we think that protein generation needs to be integrated into drug discovery, then it’s probably worth thinking about how to set up tasks and benchmarks that mimic those workflows? Similar to how Segment Anything introduced point prompting as a segmentation task. I think this space is quite hazy and hard to clear, and my intuition is we’ll need to train better auxiliary models to support better metrics, given the weaknesses of existing metrics. 

[1] It’s actually a bit more complicated than this, because each of those $L$ tokens has a distinct substructure. The substructure of index 0 is quite different than the substructure of index 19, and the coordinate prediction needs to respect this. If we’re being really precise, we need to predict a $L\times 37 \times 3$, but for a particular input index, not all of the $37$ coordinates are actually relevant to the prediction task.
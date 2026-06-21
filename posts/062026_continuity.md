---
title: The Fokker-Planck Equation
date: June 20, 2026
---

<<<<<<< HEAD

The Fokker-Planck equation describes the dynamics of a probability distribution and shows up all the time in diffusion and flow matching. There are plenty of derivations online that are easy to follow but quickly turn into a bunch of algebra. This is the first one I've found where I think the main idea -- which is really quite beautiful -- comes through. Credit for this goes to the wonderful [Principles of Diffusion Models monograph](https://arxiv.org/pdf/2510.21890).
=======
The Fokker-Planck equation describes the dynamics of a probability distribution and shows up all the time in diffusion and flow matching. I have been searching for an intuitive derivation for a while now; the derivation I used previously appealed to test functions and evaluating moments, which works but is not very satisfying [1]. The main idea expressed in this proof is really quite beautiful. Credit for this goes to the wonderful [Principles of Diffusion Models monograph](https://arxiv.org/pdf/2510.21890).
>>>>>>> f789fe0 (update style, add conitnuity)

## The ODE case

We'll derive the continuity equation by considering the standard change of variables equation (which comes from arguing conservation of probability) in the infinite limit. I have previously derived this in my [writeup related to normalizing flows](post.html?p=061224_tarflow); roughly, if we have a function $\psi(\mathbf{x}_0)\rightarrow \mathbf{x}_1$ with probability distributions $p_0, p_1$, then

$$
p_1(\mathbf{x}_1) = \underbrace{p_0(\psi^{-1}(\mathbf{x}_1))}_{(*)}\underbrace{\left|\det\frac{\partial \psi^{-1}}{\partial \mathbf{x}_1}\right|}_{(**)}
$$

In flow matching, we generally have a first order update, something like this:

$$
\psi(\mathbf{x}_{t+\Delta t}) = \mathbf{x}_t + \Delta t\, \mathbf{v}_t(\mathbf{x}_t)
$$

Even if we have a more complicated update, for small enough $\Delta t$ it can always look first order. The only question is whether or not there is an additional stochastic component (i.e., is this an SDE).

For a small update, the change of variables equation we wrote earlier describes how the density changes. (*) says that the density came from somewhere else, but it's easy to write the update, then do a standard first order approximation.

$$
\psi^{-1}(\mathbf{x}_t)\approx \mathbf{x}_t - \Delta t\, \mathbf{v}_t(\mathbf{x}_t) \\
p_0(\psi^{-1}(\mathbf{x}_t))\approx p_0(\mathbf{x}_t) - \Delta t\, \nabla_\mathbf{x} p_0(\mathbf{x}_t) \cdot \mathbf{v}_t(\mathbf{x}_t)
$$

Okay, that's half of our change of variables equation. Next, (**) says that we need to account for how space warps, because the warping of space changes the local density.

$$
\frac{\partial \psi^{-1}}{\partial \mathbf{x}_t} = I - \Delta t\, \frac{\partial \mathbf{v}_t}{\partial \mathbf{x}_t}
$$

Here, I've just taken the derivative of our definition of $\psi^{-1}$ above with respect to $\mathbf{x}_t$ (which is a vector, so the partial derivative above is really a Jacobian). If we think about the implied matrix, it's something like this:

$$
\begin{pmatrix}
1 - \Delta t \frac{\partial v_1}{\partial x_1} & & & \\
& 1 - \Delta t \frac{\partial v_2}{\partial x_2} & & \\
& & \ddots & \\
& & & 1 - \Delta t \frac{\partial v_d}{\partial x_d}
\end{pmatrix}
$$

The key point is the off diagonal elements are all $o(\Delta t^2)$ contributions. To first order, this becomes

$$
\begin{aligned}
\det\frac{\partial \psi^{-1}}{\partial \mathbf{x}_t} &\approx \left(1 - \Delta t \frac{\partial v_1}{\partial x_1}\right)\left(1 - \Delta t \frac{\partial v_2}{\partial x_2}\right)\dots\left(1 - \Delta t \frac{\partial v_d}{\partial x_d}\right)\\
&\approx 1 - \Delta t\sum_{i=1}^d \frac{\partial v_i}{\partial x_i} = 1 - \Delta t\,\nabla\cdot \mathbf{v}
\end{aligned}
$$

Putting it all together, the change of variables formula becomes (dropping subscripts on the $p$, since we're about to take a limit anyway)

$$
\begin{aligned}
p(\mathbf{x}_{t+\Delta t}) &= \left(p(\mathbf{x}_t) - \Delta t\, \nabla_\mathbf{x} p(\mathbf{x}_t)\cdot \mathbf{v}_t(\mathbf{x}_t)\right)\left(1 - \Delta t\, \nabla_\mathbf{x}\cdot \mathbf{v}_t(\mathbf{x}_t) \right)\\
&\approx p(\mathbf{x}_t) - \Delta t \left( p(\mathbf{x}_t)\nabla_\mathbf{x}\cdot \mathbf{v}_t(\mathbf{x}_t) + \nabla_\mathbf{x} p(\mathbf{x}_t)\cdot \mathbf{v}_t(\mathbf{x}_t)\right) \\
&= p(\mathbf{x}_t) - \Delta t\,\nabla_\mathbf{x}\cdot\left(p(\mathbf{x}_t)\mathbf{v}_t(\mathbf{x}_t)\right)
\end{aligned}
$$

Taking $\Delta t \rightarrow 0$,

$$
\boxed{\frac{\partial p}{\partial t} = -\nabla_\mathbf{x}\cdot\left(p_t(\mathbf{x})\mathbf{v}_t(\mathbf{x})\right)}
$$

This is exactly the continuity equation. In other words, when we have a deterministic transport map, the continuity equation is just what emerges from applying change of variables and requiring probability be conserved at every step. Another way of saying this is when I specify a particular vector field $\mathbf{v}_t(\mathbf{x})$, I have implicitly specified a sequence of distributions as particles move under that vector field, and this sequence is _enforced_ because we cannot randomly create or destroy probability. An under-appreciated fact about this equation is that we have related dynamics on individual particles (i.e., $\mathbf{v}$) to distributions, which is the whole reason generative modeling works at all!


## The stochastic case
Coming soon!

[1] I do have that derivation mostly typed up, so I may at some point add it so everyone can appreciate how much nicer this is. 

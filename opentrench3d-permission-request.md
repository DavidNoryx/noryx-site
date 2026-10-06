# Email: OpenTrench3D commercial-use permission

**Who to send to.** The dataset is from the Visual Analysis and Perception lab at
Aalborg University, Denmark.

- **Simon B. Jensen** — primary contact. He owns the GitHub repository and
  submitted the paper to arXiv, so he is the person who actually controls the
  dataset.
- **Thomas B. Moeslund** — cc. Senior author and head of the group; a licence
  decision will involve him.
- **Lars Bodum** — cc. The geoinformatics side, and the one most likely to care
  about an industrial application.

**Getting the address.** Don't guess it. Two reliable routes:
1. The author emails are printed on the first page of the paper PDF —
   `arxiv.org/pdf/2404.07711`.
2. Open an issue on `github.com/SimonBuusJensen/OpenTrench3D` asking how to
   request commercial-use permission. Public, traceable, and it reaches the
   right person by definition.

Route 2 is slower but it creates a written record, which is worth having if an
investor ever asks how you are using third-party data.

---

**Subject:** OpenTrench3D — request to use beyond CC BY-NC, and a question about QL-A ground truth

Dear Simon, Thomas and Lars,

I am David Levi, co-founder of NORYX Technologies in Israel. We work on
subsurface utility mapping — fusing GPR, LiDAR, photogrammetry and thermal
capture into a single model that an engineer can work from, expressed in ASCE
38-22 quality levels.

OpenTrench3D is the only public dataset we have found where underground
utilities are both exposed and annotated, which makes it unusually valuable:
it is one of the few places a detector can be evaluated against something close
to QL-A ground truth rather than against an estimate.

Two requests.

**First, licensing.** We are currently using the dataset internally, for
learning and for validating our own pipeline, which we read as within CC BY-NC.
We would like to go further in two ways, and want your permission before we do
rather than after:

- showing renders derived from the dataset in investor and customer material,
  with clear attribution to you and to the paper;
- using it to train models that may end up in a commercial product.

Both are commercial by any reasonable reading, so we are asking rather than
assuming. If there is a licence, a fee, or a form of attribution you would
prefer, we will follow it.

**Second, a question.** Section 5 of the paper reports per-class results. Did
you record the excavation or survey accuracy of the exposed utilities
themselves — in other words, is the annotation QL-A in the ASCE 38-22 sense, or
is it a careful annotation of a photogrammetric reconstruction? The difference
matters a great deal for how we are allowed to describe any benchmark figure we
publish, and we would rather understate it than overstate it.

We would be glad to share back anything that is useful to you: failure cases
our pipeline finds in the data, or results on our own captures using your class
definitions.

Thank you for releasing it publicly. Datasets like this are the reason small
teams can work on this problem at all.

Best regards,

David Levi
Co-founder, NORYX Technologies
david@noryx.io

---

## Why the second question matters

It is the question that makes this email read as engineering rather than
marketing, and the answer changes what NORYX is permitted to claim. If their
annotation is QL-A, "validated against QL-A ground truth" is a defensible line
in front of an investor. If it is not, that line is overstated — and overstating
accuracy is the single fastest way for a technical diligence process to stop
trusting everything else you said.

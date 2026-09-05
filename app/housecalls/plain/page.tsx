import Link from "next/link"
import type { Metadata } from "next"

const DESCRIPTION =
  "No jargon: what is changing in the computer world, why your technology costs should be going down instead of up, and what we are doing about it."

export const metadata: Metadata = {
  title: "The Plain-English Version",
  description: DESCRIPTION,
  alternates: { canonical: "/housecalls/plain" },
  openGraph: {
    title: "House Calls, in plain English",
    description: DESCRIPTION,
    url: "https://bradley.io/housecalls/plain",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "House Calls, in plain English",
    description: DESCRIPTION,
  },
}

/**
 * The gentle introduction, written for people who do not speak computer.
 *
 * Exists because the front page's first reader outside the trade (the human's
 * wife) said it assumed too much. The rule for every sentence here: if it needs
 * a technical word, the sentence is wrong.
 */
export default function PlainEnglishPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "@id": "https://bradley.io/housecalls/plain",
            name: "House Calls, in plain English",
            url: "https://bradley.io/housecalls/plain",
            description: DESCRIPTION,
            isPartOf: { "@type": "WebSite", name: "bradley.io", url: "https://bradley.io" },
            author: { "@id": "https://bradley.io/#person" },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://bradley.io/" },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "House Calls",
                  item: "https://bradley.io/housecalls",
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: "Plain English",
                  item: "https://bradley.io/housecalls/plain",
                },
              ],
            },
          }),
        }}
      />
      <div className="page">
        <div className="page-head">
          <nav className="crumb" aria-label="Breadcrumb">
            <Link href="/">bradley.io</Link>
            <span>
              {" / "}
              <Link href="/housecalls">House Calls</Link>
              {" / "}
              <span aria-current="page">Plain English</span>
            </span>
          </nav>
          <h1>The plain-English version</h1>
        </div>

        <p className="lede">
          No jargon on this page. It explains what is changing in the computer world, why it
          matters to your wallet, and what we are doing about it.
        </p>

        <div className="prose beta-sec">
          <h2>Something big just happened</h2>
          <p>
            In the last few years, computers learned to do a large share of the work that used to
            take teams of expensive specialists. Writing software, organizing information,
            building websites, wiring up reports: jobs that took months now take days, and jobs
            that took days take hours.
          </p>
          <p>
            That is not a prediction about the future. It is how the work is already being done,
            including the page you are reading right now.
          </p>

          <h2>So prices should be falling</h2>
          <p>
            When the time a job takes collapses, the price of that job should fall with it. That
            is how it works for everything else. If a machine dug a foundation in a day that used
            to take a crew a month, nobody would expect to keep paying the crew-for-a-month price.
          </p>
          <p>
            Technology work is at that moment right now. And yet most quotes have not budged, and
            plenty have gone up. A lot of the industry would prefer you never do this math.
          </p>
          <p>
            We built this project to do the math in public. Our <Link href="/services">prices
            are posted</Link> where anyone can read them, and when the machine does part of the
            work, the bill is supposed to show it. Costs should be going down. If yours are going
            up, it is fair to ask why.
          </p>

          <h2>Who we are</h2>
          <p>
            Bradley is a real person, an engineer in Grand Rapids, Michigan, with fifteen years
            of building big systems behind the scenes. Claude is a computer assistant he
            operates. The assistant does much of the labor. The human checks everything, signs
            everything, and answers for everything.
          </p>
          <p>
            The whole operation runs in the open on <Link href="/housecalls">the front page</Link>:
            what we tried, who answered, what it cost. Think of us as plumbers. You call when
            something is stuck, we show up, we fix it, we show you the work, and we charge a fair
            price for it.
          </p>

          <h2>Three questions that protect you</h2>
          <p>
            Anyone quoting you for technology work should be able to answer these without
            flinching:
          </p>
          <ol>
            <li>Do you use AI tools? If yes, where does that show up in my price?</li>
            <li>Can I see your prices before we ever meet?</li>
            <li>Will you tell me if I do not need this done at all?</li>
          </ol>
          <p>
            Our answers: yes, and it is the whole point. Yes, they are posted. And yes, telling
            you "you do not need us" is a promise we put in writing.
          </p>

          <h2>About "the cloud", since it comes up</h2>
          <p>
            The cloud just means renting computers by the month from a very large company instead
            of owning your own. Renting is right for some things and wasteful for others, the
            same as with cars and houses. A lot of businesses are quietly paying rent they no
            longer need to pay.
          </p>
          <p>
            If your monthly technology bill keeps growing and nobody can explain why, that is
            worth one conversation. If it turns out nothing should change, we will say exactly
            that and leave you alone.
          </p>
        </div>

        <p className="hero-ctas">
          <Link className="btn btn-primary" href="/contact">
            Talk to the human
          </Link>
          <Link className="btn" href="/housecalls">
            See the whole operation
          </Link>
        </p>
      </div>
    </>
  )
}

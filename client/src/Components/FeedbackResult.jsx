// One titled list in a feedback result, e.g. "Strengths"
function FeedbackList({ title, items, emptyText }) {
  return (
    <div style={{ marginTop: 12 }}>
      <h5 style={{ margin: '0 0 6px 0', fontSize: 14 }}>{title}</h5>
      {items.length === 0 ? (
        <p className="muted" style={{ margin: 0, fontSize: 14 }}>{emptyText}</p>
      ) : (
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, textAlign: 'left' }}>
          {items.map((item, i) => (
            <li key={i} style={{ marginBottom: 4 }}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

// US-33 / US-36: shows one AI feedback result. General feedback has strengths and weaknesses;
// feedback tailored to a job has the skills the CV shows and the ones it is missing.
function FeedbackResult({ feedback }) {
  const tailored = feedback.kind === 'tailored'
  return (
    <div className="card" aria-label="AI feedback" style={{ marginTop: 12, padding: 15, textAlign: 'left' }}>
      <span className="pill info">AI-generated</span>
      <span className="muted" style={{ marginLeft: 8, fontSize: 13 }}>
        {tailored ? `Tailored to ${feedback.jobTitle}. ` : ''}Review these suggestions before changing your CV.
      </span>
      {tailored ? (
        <>
          <FeedbackList title="Skills your CV shows" items={feedback.matchedSkills} emptyText="None of this job's skills were found in your CV." />
          <FeedbackList title="Missing skills" items={feedback.missingSkills} emptyText="Your CV covers everything this job lists." />
        </>
      ) : (
        <>
          <FeedbackList title="Strengths" items={feedback.strengths} emptyText="No strengths listed." />
          <FeedbackList title="Weaknesses" items={feedback.weaknesses} emptyText="No weaknesses listed." />
        </>
      )}
      <FeedbackList title="Suggestions" items={feedback.suggestions} emptyText="No suggestions." />
    </div>
  )
}

export default FeedbackResult
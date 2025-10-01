<div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden;">
	<!-- Animated background gradient -->
	<div style="position: absolute; inset: 0; background: linear-gradient(135deg, var(--color-bg-primary) 0%, var(--color-bg-secondary) 50%, var(--color-bg-tertiary) 100%); z-index: 0;"></div>

	<!-- Glass card container -->
	<div class="card" style="max-width: 48rem; width: 90%; text-align: center; position: relative; z-index: 1;">
		<div class="card-header" style="border-bottom: none; margin-bottom: var(--space-xl);">
			<h1 style="font-size: var(--text-4xl); font-weight: 700; color: var(--color-text-primary); margin-bottom: var(--space-md); letter-spacing: -0.02em;">
				Pipe<span style="color: var(--color-primary);">Lens</span>
			</h1>
			<p style="font-size: var(--text-xl); color: var(--color-text-secondary); margin: 0;">
				MongoDB Aggregation Pipeline Visual Debugger
			</p>
		</div>

		<div class="card-body" style="margin-bottom: var(--space-xl);">
			<p style="color: var(--color-text-tertiary); margin-bottom: var(--space-2xl);">
				Build, debug, and visualize MongoDB aggregation pipelines with stage-by-stage preview and execution time tracking.
			</p>

			<div style="display: flex; gap: var(--space-md); justify-content: center; flex-wrap: wrap;">
				<a href="/builder" class="btn btn-primary btn-lg">
					<svg style="width: 1.25rem; height: 1.25rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
					</svg>
					Open Pipeline Builder
				</a>
				<a href="/docs" class="btn btn-secondary btn-lg">
					<svg style="width: 1.25rem; height: 1.25rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
					</svg>
					Documentation
				</a>
			</div>
		</div>

		<div style="padding-top: var(--space-lg); border-top: 1px solid var(--glass-border);">
			<div class="badge badge-success" style="font-size: var(--text-sm);">
				Phase 2: Stage Preview - Complete
			</div>
		</div>
	</div>

	<!-- Decorative elements -->
	<div style="position: absolute; top: 10%; left: 10%; width: 300px; height: 300px; background: radial-gradient(circle, rgba(0, 237, 100, 0.1) 0%, transparent 70%); border-radius: 50%; filter: blur(60px); z-index: 0;"></div>
	<div style="position: absolute; bottom: 10%; right: 10%; width: 400px; height: 400px; background: radial-gradient(circle, rgba(19, 170, 82, 0.08) 0%, transparent 70%); border-radius: 50%; filter: blur(80px); z-index: 0;"></div>
</div>
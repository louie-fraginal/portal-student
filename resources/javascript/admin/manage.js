document.addEventListener('DOMContentLoaded', () => {
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.admin-section');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            navButtons.forEach(b => b.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            btn.classList.add('active');
            const targetSection = document.getElementById(targetId);
            if (targetSection) targetSection.classList.add('active');
        });
    });

    // Forms and Inputs
    const announcementForm = document.getElementById('form-announcement');
    const eventForm = document.getElementById('form-events');

    // Image Compression Function
    async function compressImage(file, { quality = 0.6, maxWidth = 1200 }) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth) {
                        height = (maxWidth / width) * height;
                        width = maxWidth;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        resolve(blob);
                    }, 'image/jpeg', quality);
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
    }

    // Supabase Upload Function
    async function uploadToSupabase(blob, fileName, bucket = 'images') {
        const filePath = `admin/${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const { data, error } = await window.supabaseClient.storage
            .from(bucket)
            .upload(filePath, blob, {
                contentType: 'image/jpeg',
                upsert: false
            });

        if (error) throw error;

        const { data: { publicUrl } } = window.supabaseClient.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return publicUrl;
    }

    // Announcement Submission
    if (announcementForm) {
        announcementForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = announcementForm.querySelector('.submit');
            const originalText = submitBtn.innerHTML;
            
            try {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<strong>UPLOADING...</strong>';

                const content = document.getElementById('announcement-content').value;
                const department = document.getElementById('typeOfAnnouncement').value;
                const fileInput = document.getElementById('announcement-file');
                let imageUrl = '';

                if (fileInput.files.length > 0) {
                    const file = fileInput.files[0];
                    const compressedBlob = await compressImage(file, { quality: 0.7 });
                    imageUrl = await uploadToSupabase(compressedBlob, file.name);
                }

                const { error } = await window.supabaseClient
                    .from('notices')
                    .insert([
                        { 
                            department: department,
                            content: content, 
                            image_url: imageUrl
                        }
                    ]);

                if (error) throw error;

                alert('Announcement posted successfully!');
                announcementForm.reset();
                document.getElementById('announcement-preview-container').innerHTML = '<p style="opacity: 0.5;">Announcement preview will appear here...</p>';
            } catch (err) {
                console.error('Error posting announcement:', err);
                alert('Failed to post announcement: ' + err.message);
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }

    // Event Submission
    if (eventForm) {
        eventForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = eventForm.querySelector('.submit');
            const originalText = submitBtn.innerHTML;

            try {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<strong>UPLOADING...</strong>';

                const header = document.getElementById('event-header').value;
                const subheader = document.getElementById('event-subheader').value;
                const fileInput = document.getElementById('event-file');
                let imageUrl = document.getElementById('event-image').value;

                if (fileInput.files.length > 0) {
                    const file = fileInput.files[0];
                    const compressedBlob = await compressImage(file, { quality: 0.7 });
                    imageUrl = await uploadToSupabase(compressedBlob, file.name);
                }

                const { error } = await window.supabaseClient
                    .from('events')
                    .insert([
                        { 
                            header: header, 
                            subheader: subheader, 
                            image_url: imageUrl
                        }
                    ]);

                if (error) throw error;

                alert('Event posted successfully!');
                eventForm.reset();
                document.getElementById('event-preview').innerHTML = '<p style="opacity: 0.5;">Event preview will appear here...</p>';
            } catch (err) {
                console.error('Error posting event:', err);
                alert('Failed to post event: ' + err.message);
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }

    // Preview Functions
    function showPreview(containerId, data) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';
        
        const card = document.createElement('div');
        card.className = 'post-card-bento visible';
        card.style.opacity = '1';
        card.style.transform = 'none';

        const deptColor = window.DEPT_MAP[data.category]?.color || 'var(--accent-primary)';

        card.innerHTML = `
            ${data.image ? `<img src="${data.image}" class="post-card-image" alt="Preview">` : ''}
            <div style="padding: 15px 0;">
                <span class="tag" style="background: ${deptColor}; color: white; margin-bottom: 10px; display: inline-block;">${data.category}</span>
                <h2 class="post-card-title">${data.title || 'Official Announcement'}</h2>
                <p class="post-card-text">${data.content || 'No content provided.'}</p>
            </div>
            <div class="post-card-footer">
                <span>Just Now</span>
            </div>
        `;

        container.appendChild(card);
    }

    // Announcement Preview
    const announcementPreviewBtn = document.getElementById('announcement-preview');
    if (announcementPreviewBtn) {
        announcementPreviewBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const content = document.getElementById('announcement-content').value;
            const department = document.getElementById('typeOfAnnouncement').value;
            const fileInput = document.getElementById('announcement-file');
            
            let imageUrl = '';
            if (fileInput.files.length > 0) {
                imageUrl = URL.createObjectURL(fileInput.files[0]);
            }

            showPreview('announcement-preview-container', {
                title: 'Announcement Preview',
                content,
                category: department,
                image: imageUrl
            });
        });
    }

    // Event Preview
    const eventPreviewBtn = document.getElementById('event-preview-btn');
    if (eventPreviewBtn) {
        eventPreviewBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const header = document.getElementById('event-header').value;
            const subheader = document.getElementById('event-subheader').value;
            const fileInput = document.getElementById('event-file');
            const urlInput = document.getElementById('event-image').value;

            let imageUrl = urlInput;
            if (fileInput.files.length > 0) {
                imageUrl = URL.createObjectURL(fileInput.files[0]);
            }

            showPreview('event-preview', {
                title: header,
                content: subheader,
                category: 'ANNOUNCEMENT',
                image: imageUrl
            });
        });
    }
});

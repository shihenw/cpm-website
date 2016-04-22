import cv2 as cv
import numpy as np
import os
import math
from matplotlib.pylab import cm

def visualize_save(test_image, heatmaps, prediction, param, model):
	directory = '../results/'
	if not os.path.exists(directory):
		os.makedirs(directory)

	colormap = cm.jet_r
	oriImg = cv.imread(test_image)
	prediction = prediction.astype(np.int)

	prefix = os.path.basename(test_image).split('.')[0]
	npart = model['np']

	# save heatmap superimposed and marked images
	for c in range(heatmaps.shape[2]):
		colorized = colormap(heatmaps[:,:,c])
		img_superimposed = (colorized[:,:,0:3] * 255 + oriImg)/2
		img_superimposed = img_superimposed.astype(np.uint8)
		#print img_superimposed
		if c != npart:
			img_superimposed = drawCross(img_superimposed, prediction[c])
		cv.imwrite('%s/%s_heatmap%d.png' % (directory, prefix, c+1), img_superimposed)

	# draw limbs
	limbs = model['limbs']
	colormap = cm.get_cmap('hsv_r')
	facealpha = 0.6

	bodyHeight = np.max(prediction[:,0]) - np.min(prediction[:,0])
	stickwidth = oriImg.shape[0]/30.0
	thre = 0.05

	img_stickman = oriImg.copy()
	for p in range(limbs.shape[0]):
		x1 = prediction[limbs[p,0]-1, 0]
		y1 = prediction[limbs[p,0]-1, 1]
		if heatmaps[x1,y1,limbs[p,0]-1] < thre:
			continue
		x2 = prediction[limbs[p,1]-1, 0]
		y2 = prediction[limbs[p,1]-1, 1]
		if heatmaps[x2,y2,limbs[p,1]-1] < thre:
			continue

		X = prediction[limbs[p,:]-1, 0]
		Y = prediction[limbs[p,:]-1, 1]
		mX = np.mean(X)
		mY = np.mean(Y)
		length = ((X[0] - X[1]) ** 2 + (Y[0] - Y[1]) ** 2) ** 0.5
		if Y[0] - Y[1] == 0:
			angle = 90
		else:
			angle = math.degrees(math.atan(float(X[0] - X[1]) / float(Y[0] - Y[1])))
		polygon = cv.ellipse2Poly((int(mY),int(mX)), (int(length/2), int(stickwidth)), int(angle), 0, 360, 1)
		color = [x * 255 for x in list(colormap(float(p)/limbs.shape[0]))]
		color = tuple(color[0:3])
		cv.fillConvexPoly(img_stickman, polygon, color)
		
	for c in range(heatmaps.shape[2]-1):
		img_stickman = drawDot(img_stickman, prediction[c])

	cv.addWeighted(img_stickman, facealpha, oriImg, 1 - facealpha, 0, img_stickman)
	cv.imwrite('%s/%s_stickman.png' % (directory, prefix), img_stickman)

def drawCross(img, center):
	offset = 3
	thick = 2
	cv.line(img, (center[1]-offset, center[0]-offset), (center[1]+offset, center[0]+offset), (255,255,255), thick)
	cv.line(img, (center[1]-offset, center[0]+offset), (center[1]+offset, center[0]-offset), (255,255,255), thick)
	return img

def drawDot(img, center):
	radius = 3
	cv.circle(img, (center[1], center[0]), radius, (0, 0, 0), -1)
	return img

# function h = filledellipse(A,xc,col,facealpha)
#     [V,D] = eig(A);
#     % define points on a unit circle
#     th = linspace(0, 2*pi, 50);
#     pc = [cos(th);sin(th)];

#     % warp it into the ellipse
#     pe = sqrtm(A)*pc;
#     pe = bsxfun(@plus, xc(:), pe);
#     h = patch(pe(1,:),pe(2,:),col);
#     set(h,'FaceAlpha',facealpha);
#     set(h,'EdgeAlpha',0);